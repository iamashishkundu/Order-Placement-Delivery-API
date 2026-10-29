const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');

class Product extends Model {
  static associate(models) {
    if (models.Vendor) {
      Product.belongsTo(models.Vendor, {
        foreignKey: 'vendorId',
        as: 'vendor',
        onDelete: 'CASCADE',
      });
    }
    if (models.Category) {
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category',
        onDelete: 'RESTRICT',
      });
    }
    if (models.CartItem) {
      Product.hasMany(models.CartItem, {
        foreignKey: 'productId',
        as: 'cartItems',
        onDelete: 'CASCADE',
      });
    }
    if (models.OrderItem) {
      Product.hasMany(models.OrderItem, {
        foreignKey: 'productId',
        as: 'orderItems',
        onDelete: 'RESTRICT',
      });
    }
  }
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isDisabledByAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    paranoid: true, // Enables soft delete using deletedAt
  }
);

module.exports = Product;

