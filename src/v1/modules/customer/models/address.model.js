const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');

class Address extends Model {
  static associate(models) {
    if (models.Customer) {
      Address.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
        onDelete: 'CASCADE',
      });
    }
  }
}

Address.init(
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
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressLine: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Address',
    tableName: 'addresses',
    timestamps: true,
  }
);

module.exports = Address;

