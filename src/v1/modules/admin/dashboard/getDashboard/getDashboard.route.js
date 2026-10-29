const express = require('express');
const getDashboardController = require('./getDashboard.controller');

const router = express.Router();

router.get('/', getDashboardController);

module.exports = router;

