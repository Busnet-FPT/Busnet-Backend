const Notification = require("../models/Notification");

const createNotification = (accountId, { title, content, type, referenceId }) =>
  Notification.create({ accountId, title, content, type, referenceId }).catch(() => null);

module.exports = createNotification;
