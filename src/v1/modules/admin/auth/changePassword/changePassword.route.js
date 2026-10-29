const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const authenticate = require('../../../../../common/middlewares/authenticate');
const authorizeRole = require('../../../../../common/middlewares/authorizeRole');
const ROLES = require('../../../../../common/constants/roles');
const changePasswordValidation = require('./changePassword.validation');
const changePasswordController = require('./changePassword.controller');

const router = express.Router();

router.patch(
  '/change-password',
  authenticate,
  authorizeRole(ROLES.ADMIN),
  validate(changePasswordValidation),
  changePasswordController
);

module.exports = router;

