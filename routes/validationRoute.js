const express = require('express');
const router = express.Router();
const validationController  = require('../controller/validationController');

// POST route to verify APK signature
router.post('/signature', validationController.apksign);

module.exports = router;
