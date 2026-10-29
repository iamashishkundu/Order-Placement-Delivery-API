const express = require('express');
const listAddressesController = require('./listAddresses.controller');

const router = express.Router();

router.get('/', listAddressesController);

module.exports = router;

