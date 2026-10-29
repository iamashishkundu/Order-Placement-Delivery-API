const express = require('express');
const vendorGate = require('../../middlewares/vendorGate');
const getProfileController = require('./getProfile.controller');

const router = express.Router();

router.get('/', vendorGate('APPROVED'), getProfileController);

module.exports = router;

