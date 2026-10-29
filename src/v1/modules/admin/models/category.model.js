const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');

class Category extends Model {
  static associate(models) {
    if (models.Product) {
      Category.hasMany(models.Product, {
        foreignKey: 'categoryId',
        as: 'products',
        onDelete: 'RESTRICT',
      });
    }
  }
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
  }
);

module.exports = Category;

