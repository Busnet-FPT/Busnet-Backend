const express = require('express');
const authRoutes = require('./auth.routes');
const blogRoutes = require('./blog.routes');
const subscriptionRoutes = require('./subscription.routes');
const operatorRoutes = require('./operator.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/operators', operatorRoutes);

module.exports = router;