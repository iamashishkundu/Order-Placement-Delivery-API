const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');
const { PAYMENT_STATUS, PAYMENT_METHOD } = require('../../../../common/constants/orderStatus');

class Order extends Model {
  static associate(models) {
    if (models.Customer) {
      Order.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
        onDelete: 'RESTRICT',
      });
    }
    if (models.OrderItem) {
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items',
        onDelete: 'CASCADE',
      });
    }
    if (models.Payment) {
      Order.hasOne(models.Payment, {
        foreignKey: 'orderId',
        as: 'payment',
        onDelete: 'CASCADE',
      });
    }
  }
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    addressSnapshot: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'USD',
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(20),
      defaultValue: PAYMENT_METHOD.COD,
      allowNull: false,
      validate: {
        isIn: [[PAYMENT_METHOD.COD, PAYMENT_METHOD.ONLINE]],
      },
    },
    paymentStatus: {
      type: DataTypes.STRING(20),
      defaultValue: PAYMENT_STATUS.PENDING,
      allowNull: false,
      validate: {
        isIn: [[
          PAYMENT_STATUS.PENDING,
          PAYMENT_STATUS.PAID,
          PAYMENT_STATUS.FAILED,
          PAYMENT_STATUS.REFUNDED,
        ]],
      },
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
  }
);

module.exports = Order;
