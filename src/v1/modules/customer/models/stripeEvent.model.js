const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/database');

class StripeEvent extends Model {
  static associate() {
    // Audit/idempotency table - no relations needed
  }
}

StripeEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'StripeEvent',
    tableName: 'stripe_events',
    timestamps: true,
  }
);

module.exports = StripeEvent;
