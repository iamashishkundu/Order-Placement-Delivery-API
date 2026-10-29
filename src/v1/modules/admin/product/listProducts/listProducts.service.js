const { Op } = require('sequelize');
const Product = require('../../../vendor/models/product.model');
const Category = require('../../models/category.model');
const Vendor = require('../../../vendor/models/vendor.model');

const listProducts = async ({
  categoryId,
  vendorId,
  isAvailable,
  isDisabledByAdmin,
  search,
  page = 1,
  limit = 20,
}) => {
  const where = {};

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (vendorId) {
    where.vendorId = vendorId;
  }

  if (typeof isAvailable === 'boolean') {
    where.isAvailable = isAvailable;
  }

  if (typeof isDisabledByAdmin === 'boolean') {
    where.isDisabledByAdmin = isDisabledByAdmin;
  }

  if (search) {
    where.name = { [Op.iLike]: `%${search.trim()}%` };
  }

  const offset = (page - 1) * limit;

  const { count: total, rows: products } = await Product.findAndCountAll({
    where,
    include: [
      {
        model: Vendor,
        as: 'vendor',
        attributes: ['id', 'shopName', 'ownerName', 'email', 'phone', 'status'],
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'isActive'],
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

