const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');

class Admin extends Model {
  // eslint-disable-next-line no-unused-vars
  static associate(models) {
    // Admin has no direct foreign key relations
  }
}

Admin.init(
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
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Admin',
    tableName: 'admins',
    timestamps: true,
  }
);

module.exports = Admin;

