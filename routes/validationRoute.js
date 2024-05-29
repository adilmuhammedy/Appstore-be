const express = require('express');
const router = express.Router();
const validationController  = require('../controller/testCaseController');

// POST route to verify APK signature
router.post('/update', validationController.updateValidation);
router.get('/:id',validationController.getValidation);

module.exports = router;
