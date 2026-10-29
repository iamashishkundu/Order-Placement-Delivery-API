const express = require('express');
const vendorGate = require('../../middlewares/vendorGate');
const getStatusController = require('./getStatus.controller');

const router = express.Router();

router.get('/status', vendorGate('AUTHENTICATED'), getStatusController);

module.exports = router;

