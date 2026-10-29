const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listCustomers } = require('./listCustomers.service');

const listCustomersController = asyncHandler(async (req, res) => {
  const { customers, meta } = await listCustomers(req.query);
  return successResponse(res, 200, 'Customers fetched successfully.', customers, meta);
});

module.exports = listCustomersController;

