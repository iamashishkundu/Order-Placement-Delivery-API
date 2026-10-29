const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listCategories } = require('./listCategories.service');

const listCategoriesController = asyncHandler(async (req, res) => {
  const { categories, meta } = await listCategories(req.query);
  return successResponse(res, 200, 'Categories fetched successfully.', categories, meta);
});

module.exports = listCategoriesController;

