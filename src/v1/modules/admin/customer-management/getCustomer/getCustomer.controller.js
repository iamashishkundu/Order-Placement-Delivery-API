const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getCustomer } = require('./getCustomer.service');

const getCustomerController = asyncHandler(async (req, res) => {
  const customer = await getCustomer(req.params.customerId);
  return successResponse(res, 200, 'Customer details fetched successfully.', customer);
});

module.exports = getCustomerController;

