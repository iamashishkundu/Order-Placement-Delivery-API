const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateCategory } = require('./updateCategory.service');

const updateCategoryController = asyncHandler(async (req, res) => {
  const category = await updateCategory(req.params.categoryId, req.body);
  return successResponse(res, 200, 'Category updated successfully.', category);
});

module.exports = updateCategoryController;

