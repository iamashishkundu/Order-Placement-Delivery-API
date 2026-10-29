const Category = require('../../../admin/models/category.model');

const listCategories = async () => {
  const categories = await Category.findAll({
    where: { isActive: true },
    attributes: ['id', 'name'],
    order: [['name', 'ASC']],
  });

  return categories;
};

module.exports = {
  listCategories,
};

