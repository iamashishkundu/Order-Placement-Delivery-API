const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { createCategory } = require('./createCategory.service');

const createCategoryController = asyncHandler(async (req, res) => {
  const category = await createCategory(req.body);
  return successResponse(res, 201, 'Category created successfully.', category);
});

module.exports = createCategoryController;

