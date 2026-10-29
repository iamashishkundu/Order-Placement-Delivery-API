const express = require('express');
const getCartController = require('./getCart.controller');

const router = express.Router();

router.get('/', getCartController);

module.exports = router;

