const express = require('express');
const getProfileController = require('./getProfile.controller');

const router = express.Router();

router.get('/', getProfileController);

module.exports = router;

