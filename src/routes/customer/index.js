const express = require('express');
const authRoutes = require('./auth.routes');
const blogRoutes = require('./blog.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes)

module.exports = router;