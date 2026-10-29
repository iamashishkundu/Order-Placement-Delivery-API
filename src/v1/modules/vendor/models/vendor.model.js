const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');
const VENDOR_STATUS = require('../../../../common/constants/vendorStatus');

class Vendor extends Model {
  static associate(models) {
    if (models.VendorOtp) {
      Vendor.hasMany(models.VendorOtp, {
        foreignKey: 'vendorId',
        as: 'otps',
        onDelete: 'CASCADE',
      });
    }
    if (models.Product) {
      Vendor.hasMany(models.Product, {
        foreignKey: 'vendorId',
        as: 'products',
        onDelete: 'CASCADE',
      });
    }
    if (models.OrderItem) {
      Vendor.hasMany(models.OrderItem, {
        foreignKey: 'vendorId',
        as: 'orderItems',
        onDelete: 'RESTRICT',
      });
    }
  }
}

Vendor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: VENDOR_STATUS.PENDING,
      allowNull: false,
      validate: {
        isIn: [[
          VENDOR_STATUS.PENDING,
          VENDOR_STATUS.APPROVED,
          VENDOR_STATUS.REJECTED,
          VENDOR_STATUS.BLOCKED,
        ]],
      },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shopName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressLine: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Vendor',
    tableName: 'vendors',
    timestamps: true,
  }
);

module.exports = Vendor;

