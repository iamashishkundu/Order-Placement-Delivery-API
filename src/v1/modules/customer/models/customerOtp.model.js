const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');

class CustomerOtp extends Model {
  // eslint-disable-next-line no-unused-vars
  static associate(models) {
    // CustomerOtp is identified by phone, no direct FK relation
  }
}

CustomerOtp.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otpHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lastSentAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    consumedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CustomerOtp',
    tableName: 'customer_otps',
    timestamps: true,
  }
);

module.exports = CustomerOtp;

