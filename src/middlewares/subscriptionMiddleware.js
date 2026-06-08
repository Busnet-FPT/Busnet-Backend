const PartnerSubscription = require("../models/PartnerSubscription");

const requireActiveSubscription = async (req, res, next) => {
  try {
    const sub = await PartnerSubscription.findOne({
      partnerId: req.user._id,
      subscriptionStatus: "ACTIVE",
      expirationDate: { $gt: new Date() },
    }).populate("planId");

    if (!sub) {
      return res.status(403).json({
        success: false,
        message: "Bạn cần có gói đăng ký đang hoạt động để sử dụng tính năng này",
      });
    }

    req.subscription = sub;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireActiveSubscription };
