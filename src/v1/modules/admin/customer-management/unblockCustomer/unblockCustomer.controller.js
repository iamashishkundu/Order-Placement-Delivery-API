const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { unblockCustomer } = require('./unblockCustomer.service');

const unblockCustomerController = asyncHandler(async (req, res) => {
  const customer = await unblockCustomer(req.params.customerId);
  return successResponse(res, 200, 'Customer unblocked successfully.', customer);
});

module.exports = unblockCustomerController;

