const express = require('express');
const vendorGate = require('../../middlewares/vendorGate');
const getDashboardController = require('./getDashboard.controller');

const router = express.Router();

router.get('/', vendorGate('PROFILE_COMPLETE'), getDashboardController);

module.exports = router;

