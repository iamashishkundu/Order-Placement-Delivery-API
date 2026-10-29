const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const listVendorsValidation = require('./listVendors.validation');
const listVendorsController = require('./listVendors.controller');

const router = express.Router();

router.get('/', validate(listVendorsValidation), listVendorsController);

module.exports = router;

