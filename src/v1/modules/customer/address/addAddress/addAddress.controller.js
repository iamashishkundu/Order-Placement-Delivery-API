const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { addAddress } = require('./addAddress.service');

const addAddressController = asyncHandler(async (req, res) => {
  const address = await addAddress(req.user.id, req.body);
  return successResponse(res, 201, 'Address added successfully.', address);
});

module.exports = addAddressController;

