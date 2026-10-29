const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');

class VendorOtp extends Model {
  static associate(models) {
    if (models.Vendor) {
      VendorOtp.belongsTo(models.Vendor, {
        foreignKey: 'vendorId',
        as: 'vendor',
        onDelete: 'CASCADE',
      });
    }
  }
}

VendorOtp.init(
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
    channel: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['phone', 'email']],
      },
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
    modelName: 'VendorOtp',
    tableName: 'vendor_otps',
    timestamps: true,
  }
);

module.exports = VendorOtp;

