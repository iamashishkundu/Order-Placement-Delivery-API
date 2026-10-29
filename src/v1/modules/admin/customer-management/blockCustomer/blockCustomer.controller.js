const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { blockCustomer } = require('./blockCustomer.service');

const blockCustomerController = asyncHandler(async (req, res) => {
  const customer = await blockCustomer(req.params.customerId);
  return successResponse(res, 200, 'Customer blocked successfully.', customer);
});

module.exports = blockCustomerController;

