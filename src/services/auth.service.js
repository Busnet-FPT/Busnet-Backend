const bcrypt = require('bcryptjs');
const Account = require('../models/Account');
const CodeVerification = require('../models/CodeVerification');
const generateToken = require('../utils/generateToken');
const generateVerificationCode = require('../utils/generateCode');
const AppError = require('../utils/AppError');
const { verifyGoogleToken } = require('./googleAuth.service');

const BCRYPT_SALT_ROUNDS = 10;

// ============================
// REGISTER CUSTOMER
// ============================

/**
 * Register a new customer account
 *
 * Flow (inspired by Bonix pattern):
 * 1. Validate email uniqueness
 * 2. Validate username uniqueness
 * 3. Validate phone uniqueness
 * 4. Hash password with bcrypt
 * 5. Create Account with status UNVERIFIED
 * 6. Generate OTP 6-digit code
 * 7. Hash OTP and save to CodeVerification (expires in 10 minutes)
 * 8. Return account data + OTP (Phase 1: for Postman testing)
 *
 * @param {object} data - Registration data from request body
 * @returns {object} { account, verificationCode }
 * @throws {AppError} 409 if email/username/phone already exists
 */
const registerCustomer = async (data) => {
    const { username, email, password, fullName, phone, gender, dob } = data;

    // Step 1: Check email duplicate (only non-deleted CUSTOMER accounts)
    const existingEmail = await Account.findOne({
        email: email.toLowerCase(),
        deletedAt: null
    });
    if (existingEmail) {
        throw new AppError('This email is already registered', 409);
    }

    // Step 2: Check username duplicate
    const existingUsername = await Account.findOne({
        username,
        deletedAt: null
    });
    if (existingUsername) {
        throw new AppError('This username is already taken', 409);
    }

    // Step 3: Check phone duplicate
    const existingPhone = await Account.findOne({
        phone,
        deletedAt: null
    });
    if (existingPhone) {
        throw new AppError('This phone number is already registered', 409);
    }

    // Step 4: Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Step 5: Create Account (status: UNVERIFIED)
    const account = await Account.create({
        username,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        fullName,
        gender: gender || 'UNKNOWN',
        dob: dob ? new Date(dob) : undefined,
        role: 'CUSTOMER',
        status: 'UNVERIFIED',
        isEmailVerified: false,
        isPhoneVerified: false
    });

    // Step 6: Generate 6-digit OTP
    const verificationCode = generateVerificationCode();

    // Step 7: Hash OTP and save to CodeVerification (expires in 10 minutes)
    const codeHash = await bcrypt.hash(verificationCode, BCRYPT_SALT_ROUNDS);
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await CodeVerification.create({
        accountId: account._id,
        target: email.toLowerCase(),
        targetType: 'EMAIL',
        type: 'REGISTER',
        codeHash,
        expiredAt
    });

    // Step 8: Return data
    // Phase 1: Include OTP in response for testing
    // Phase 2: Send OTP via email instead
    return {
        account: {
            _id: account._id,
            username: account.username,
            email: account.email,
            phone: account.phone,
            fullName: account.fullName,
            gender: account.gender,
            dob: account.dob,
            role: account.role,
            status: account.status,
            profilePicture: account.profilePicture,
            createdAt: account.createdAt
        },
        verificationCode // Phase 1: return OTP for Postman testing
    };
};

// ============================
// LOGIN CUSTOMER
// ============================

const loginCustomer = async ({ identifier, password }) => {
    if (!identifier || !password) {
        throw new AppError('Please enter email/phone number and password', 400);
    }

    const account = await Account.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { phone: identifier }
        ],
        role: 'CUSTOMER'
    }).select('+passwordHash');

    if (!account) {
        throw new AppError('Incorrect account or password', 401);
    }

    if (account.status === 'DELETED') {
        throw new AppError('This account has been deleted', 403);
    }

    if (account.status === 'BANNED') {
        throw new AppError('This account has been banned', 403);
    }

    if (account.status === 'UNVERIFIED') {
        throw new AppError('This account has not been verified. Please verify your email first', 403);
    }

    if (account.status !== 'ACTIVE') {
        throw new AppError('This account has not been activated', 403);
    }

    const isMatch = await bcrypt.compare(password, account.passwordHash);

    if (!isMatch) {
        throw new AppError('Incorrect account or password', 401);
    }

    const token = generateToken({
        accountId: account._id,
        role: account.role
    });

    return {
        token,
        account: {
            _id: account._id,
            username: account.username,
            email: account.email,
            phone: account.phone,
            fullName: account.fullName,
            role: account.role,
            status: account.status,
            profilePicture: account.profilePicture
        }
    };
};

// ============================
// GOOGLE LOGIN / REGISTER CUSTOMER
// ============================

/**
 * Login or register a customer using Google OAuth Token
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<object>} { token, account }
 */
const loginGoogleCustomer = async (idToken) => {
    if (!idToken) {
        throw new AppError('Google ID Token is required', 400);
    }

    const payload = await verifyGoogleToken(idToken);
    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email) {
        throw new AppError('Google account does not provide an email address', 400);
    }

    // Step 1: Find account by Google ID or by email
    let account = await Account.findOne({ googleId, deletedAt: null });

    if (!account) {
        // Find by email if googleId not found (link existing account)
        account = await Account.findOne({ email: email.toLowerCase(), deletedAt: null });
        
        if (account) {
            // Check if role is CUSTOMER
            if (account.role !== 'CUSTOMER') {
                throw new AppError('Google login is only available for Customer accounts', 403);
            }
            // Link googleId to existing account
            account.googleId = googleId;
            account.isOAuthUser = true;
            if (email_verified) {
                account.isEmailVerified = true;
                if (account.status === 'UNVERIFIED') {
                    account.status = 'ACTIVE';
                }
            }
            if (picture && !account.profilePicture) {
                account.profilePicture = picture;
            }
            await account.save();
        }
    }

    // Step 2: Create new account if not found
    if (!account) {
        // Generate a random username or base it on email
        let baseUsername = email.split('@')[0];
        let username = baseUsername;
        let isUsernameTaken = await Account.findOne({ username, deletedAt: null });
        let counter = 1;
        while (isUsernameTaken) {
            username = `${baseUsername}${counter}`;
            isUsernameTaken = await Account.findOne({ username, deletedAt: null });
            counter++;
        }

        account = await Account.create({
            username,
            email: email.toLowerCase(),
            googleId,
            fullName: name,
            profilePicture: picture,
            role: 'CUSTOMER',
            status: email_verified ? 'ACTIVE' : 'UNVERIFIED',
            isOAuthUser: true,
            isEmailVerified: !!email_verified,
        });
    }

    // Step 3: Validate account status
    if (account.status === 'DELETED') {
        throw new AppError('This account has been deleted', 403);
    }

    if (account.status === 'BANNED') {
        throw new AppError('This account has been banned', 403);
    }

    // If Google account is verified, make sure account status is ACTIVE and verified
    if (email_verified && account.status === 'UNVERIFIED') {
        account.status = 'ACTIVE';
        account.isEmailVerified = true;
        await account.save();
    }

    if (account.status !== 'ACTIVE') {
        throw new AppError('This account has not been activated', 403);
    }

    // Step 4: Generate JWT token
    const token = generateToken({
        accountId: account._id,
        role: account.role
    });

    return {
        token,
        account: {
            _id: account._id,
            username: account.username,
            email: account.email,
            phone: account.phone,
            fullName: account.fullName,
            role: account.role,
            status: account.status,
            profilePicture: account.profilePicture
        }
    };
};

module.exports = {
    registerCustomer,
    loginCustomer,
    loginGoogleCustomer
};