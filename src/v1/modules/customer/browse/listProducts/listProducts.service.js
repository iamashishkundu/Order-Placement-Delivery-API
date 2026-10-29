const { Op } = require('sequelize');
const Product = require('../../../vendor/models/product.model');
const Vendor = require('../../../vendor/models/vendor.model');
const Category = require('../../../admin/models/category.model');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const listProducts = async ({
  search,
  categoryId,
  vendorId,
  minPrice,
  maxPrice,
  page = 1,
  limit = 20,
}) => {
  const productWhere = {
    isAvailable: true,
    isDisabledByAdmin: false,
  };

  if (categoryId) {
    productWhere.categoryId = categoryId;
  }

  if (vendorId) {
    productWhere.vendorId = vendorId;
  }

  if (search) {
    productWhere.name = { [Op.iLike]: `%${search.trim()}%` };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    productWhere.price = {};
    if (minPrice !== undefined) {
      productWhere.price[Op.gte] = minPrice;
    }
    if (maxPrice !== undefined) {
      productWhere.price[Op.lte] = maxPrice;
    }
  }

  const offset = (page - 1) * limit;

  // Vendor must be approved and profileCompleted
  const { count: total, rows: products } = await Product.findAndCountAll({
    where: productWhere,
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
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    products,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

module.exports = {
  listProducts,
};

