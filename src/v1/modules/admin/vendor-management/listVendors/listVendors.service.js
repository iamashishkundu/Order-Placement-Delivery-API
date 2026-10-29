const { Op } = require('sequelize');
const Vendor = require('../../../vendor/models/vendor.model');

const listVendors = async ({ status, search, page = 1, limit = 20 }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    const searchPattern = `%${search.trim()}%`;
    where[Op.or] = [
      { shopName: { [Op.iLike]: searchPattern } },
      { ownerName: { [Op.iLike]: searchPattern } },
      { email: { [Op.iLike]: searchPattern } },
      { phone: { [Op.like]: searchPattern } },
    ];
  }

  const offset = (page - 1) * limit;

  const { count: total, rows: vendors } = await Vendor.findAndCountAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    vendors,
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

