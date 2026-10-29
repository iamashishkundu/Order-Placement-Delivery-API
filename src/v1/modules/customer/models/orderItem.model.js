const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');
const { ITEM_STATUS } = require('../../../../common/constants/orderStatus');

class OrderItem extends Model {
  static associate(models) {
    if (models.Order) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE',
      });
    }
    if (models.Vendor) {
      OrderItem.belongsTo(models.Vendor, {
        foreignKey: 'vendorId',
        as: 'vendor',
        onDelete: 'RESTRICT',
      });
    }
    if (models.Product) {
      OrderItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'RESTRICT',
      });
    }
  }
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priceAtPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    status: {
      type: DataTypes.STRING(30),
      defaultValue: ITEM_STATUS.PLACED,
      allowNull: false,
      validate: {
        isIn: [[
          ITEM_STATUS.PENDING_PAYMENT,
          ITEM_STATUS.PLACED,
          ITEM_STATUS.PREPARING,
          ITEM_STATUS.OUT_FOR_DELIVERY,
          ITEM_STATUS.DELIVERED,
          ITEM_STATUS.CANCELLED,
        ]],
      },
    },
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: true,
  }
);

module.exports = OrderItem;
