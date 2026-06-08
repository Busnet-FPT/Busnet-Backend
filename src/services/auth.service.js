const Account = require('../models/Account');
const generateToken = require('../utils/generateToken');

const loginCustomer = async ({ identifier, password }) => {
    if (!identifier || !password) {
        throw new Error('Please enter email/phone number and password');
    }

    const account = await Account.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { phone: identifier }
        ],
        role: 'CUSTOMER'
    }).select('+password');

    if (!account || !account.password || !(await account.comparePassword(password))) {
        throw new Error('Incorrect account or password');
    }

    if (account.status === 'DELETED') {
        throw new Error('This account has been deleted');
    }

    if (account.status === 'BAN') {
        throw new Error('This account has been banned');
    }

    if (account.status !== 'ACTIVE') {
        throw new Error('This account has not been activated');
    }

    const token = generateToken(account._id, account.role);

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
    loginCustomer
};