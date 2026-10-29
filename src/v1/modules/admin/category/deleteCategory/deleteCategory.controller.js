const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { deleteCategory } = require('./deleteCategory.service');

const deleteCategoryController = asyncHandler(async (req, res) => {
  const result = await deleteCategory(req.params.categoryId);
  return successResponse(res, 200, result.message);
});

module.exports = deleteCategoryController;

