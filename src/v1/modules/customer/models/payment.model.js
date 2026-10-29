const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');
const { PAYMENT_STATUS } = require('../../../../common/constants/orderStatus');

class Payment extends Model {
  static associate(models) {
    if (models.Order) {
      Payment.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE',
      });
    }
  }
}

Payment.init(
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
    provider: {
      type: DataTypes.STRING(30),
      defaultValue: 'stripe',
      allowNull: false,
    },
    providerSessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    providerPaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
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
    status: {
      type: DataTypes.STRING(30),
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
    refundId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refundedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    disputeId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    disputeStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    disputeReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    disputeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    disputeDueBy: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disputeOpenedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disputeClosedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
  }
);

module.exports = Payment;
