const { Op } = require('sequelize');
const Customer = require('../../../customer/models/customer.model');

const listCustomers = async ({ status, search, page = 1, limit = 20 }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    const searchPattern = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: searchPattern } },
      { email: { [Op.iLike]: searchPattern } },
      { phone: { [Op.like]: searchPattern } },
    ];
  }

  const offset = (page - 1) * limit;

  const { count: total, rows: customers } = await Customer.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    customers,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

module.exports = {
  listCustomers,
};

