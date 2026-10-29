const Vendor = require('../../../vendor/models/vendor.model');
const Product = require('../../../vendor/models/product.model');
const Category = require('../../../admin/models/category.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const getVendor = async (vendorId) => {
  const vendor = await Vendor.findOne({
    where: {
      id: vendorId,
      status: VENDOR_STATUS.APPROVED,
      profileCompleted: true,
    },
    attributes: [
      'id',
      'shopName',
      'ownerName',
      'addressLine',
      'city',
      'state',
      'pincode',
    ],
    include: [
      {
        model: Product,
        as: 'products',
        where: {
          isAvailable: true,
          isDisabledByAdmin: false,
        },
        required: false,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });

  if (!vendor) {
    throw ApiError.notFound(
      ERROR_CODES.NOT_FOUND,
      `Vendor not found or not active with ID ${vendorId}.`
    );
  }

  return vendor;
};

module.exports = {
  getVendor,
};

