const { Op } = require('sequelize');
const Category = require('../../models/category.model');

const listCategories = async ({ isActive, search, page = 1, limit = 20 }) => {
  const where = {};

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (search) {
    where.name = { [Op.iLike]: `%${search.trim()}%` };
  }

  const offset = (page - 1) * limit;

  const { count: total, rows: categories } = await Category.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    categories,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

module.exports = {
  listCategories,
};

