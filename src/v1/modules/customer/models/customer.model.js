const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');
const CUSTOMER_STATUS = require('../../../../common/constants/customerStatus');

class Customer extends Model {
  static associate(models) {
    if (models.Address) {
      Customer.hasMany(models.Address, {
        foreignKey: 'customerId',
        as: 'addresses',
        onDelete: 'CASCADE',
      });
    }
    if (models.CartItem) {
      Customer.hasMany(models.CartItem, {
        foreignKey: 'customerId',
        as: 'cartItems',
        onDelete: 'CASCADE',
      });
    }
    if (models.Order) {
      Customer.hasMany(models.Order, {
        foreignKey: 'customerId',
        as: 'orders',
        onDelete: 'RESTRICT',
      });
    }
  }
}

Customer.init(
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
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: CUSTOMER_STATUS.ACTIVE,
      allowNull: false,
      validate: {
        isIn: [[CUSTOMER_STATUS.ACTIVE, CUSTOMER_STATUS.BLOCKED]],
      },
    },
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true,
  }
);

module.exports = Customer;

