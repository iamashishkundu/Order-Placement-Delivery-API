const Product = require('../../../vendor/models/product.model');
const Vendor = require('../../../vendor/models/vendor.model');
const Category = require('../../../admin/models/category.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const getProduct = async (productId) => {
  const product = await Product.findOne({
    where: {
      id: productId,
      isAvailable: true,
      isDisabledByAdmin: false,
    },
    include: [
      {
        model: Vendor,
        as: 'vendor',
        where: {
          status: VENDOR_STATUS.APPROVED,
          profileCompleted: true,
        },
        attributes: ['id', 'shopName', 'city', 'state'],
      },
      {
        model: Category,
        as: 'category',
        where: {
          isActive: true,
        },
        attributes: ['id', 'name'],
      },
    ],
  });

  if (!product) {
    throw ApiError.notFound(
      ERROR_CODES.NOT_FOUND,
      `Product not found or unavailable with ID ${productId}.`
    );
  }

  return product;
};

module.exports = {
  getProduct,
};

