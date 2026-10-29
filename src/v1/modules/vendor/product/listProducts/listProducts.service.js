const { Op } = require('sequelize');
const Product = require('../../models/product.model');
const Category = require('../../../admin/models/category.model');

const listProducts = async (vendorId, { categoryId, isAvailable, search, page = 1, limit = 20 }) => {
  const where = {
    vendorId,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (typeof isAvailable === 'boolean') {
    where.isAvailable = isAvailable;
  }

  if (search) {
    where.name = { [Op.iLike]: `%${search.trim()}%` };
  }

  const offset = (page - 1) * limit;

  const { count: total, rows: products } = await Product.findAndCountAll({
    where,
    include: [
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

