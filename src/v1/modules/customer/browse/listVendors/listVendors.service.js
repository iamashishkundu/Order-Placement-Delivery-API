const { Op } = require('sequelize');
const Vendor = require('../../../vendor/models/vendor.model');
const Product = require('../../../vendor/models/product.model');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const listVendors = async ({ search, page = 1, limit = 20 }) => {
  const vendorWhere = {
    status: VENDOR_STATUS.APPROVED,
    profileCompleted: true,
  };

  if (search) {
    const searchPattern = `%${search.trim()}%`;
    vendorWhere[Op.or] = [
      { shopName: { [Op.iLike]: searchPattern } },
      { ownerName: { [Op.iLike]: searchPattern } },
      { city: { [Op.iLike]: searchPattern } },
    ];
  }

  // Include products with visible condition required: true so vendor must have visible products
  const productWhere = {
    isAvailable: true,
    isDisabledByAdmin: false,
  };

  const vendors = await Vendor.findAll({
    where: vendorWhere,
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
        where: productWhere,
        required: true, // Only vendors with at least one visible product
        attributes: ['id'],
      },
    ],
    order: [['shopName', 'ASC']],
  });

  const total = vendors.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;

  const paginatedVendors = vendors.slice(offset, offset + limit).map((v) => {
    const vJson = v.toJSON();
    delete vJson.products;
    return vJson;
  });

  return {
    vendors: paginatedVendors,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

module.exports = {
  listVendors,
};

