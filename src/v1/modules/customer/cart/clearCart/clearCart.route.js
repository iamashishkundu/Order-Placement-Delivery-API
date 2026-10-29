const express = require('express');
const clearCartController = require('./clearCart.controller');

const router = express.Router();

router.delete('/', clearCartController);

module.exports = router;

