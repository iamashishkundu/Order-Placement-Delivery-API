'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      provider: {
        type: Sequelize.STRING(30),
        defaultValue: 'stripe',
        allowNull: false,
      },
      providerSessionId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      providerPaymentIntentId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'USD',
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(30),
        defaultValue: 'pending',
        allowNull: false,
      },
      refundId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      refundedAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
      },
      disputeId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      disputeStatus: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      disputeReason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      disputeAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      disputeDueBy: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      disputeOpenedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      disputeClosedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('payments', ['orderId'], {
      name: 'idx_payments_order_id',
    });
    await queryInterface.addIndex('payments', ['providerSessionId'], {
      name: 'idx_payments_provider_session_id',
      unique: true,
    });
    await queryInterface.addIndex('payments', ['providerPaymentIntentId'], {
      name: 'idx_payments_provider_payment_intent_id',
    });
    await queryInterface.addIndex('payments', ['disputeId'], {
      name: 'idx_payments_dispute_id',
      unique: true,
    });
    await queryInterface.addIndex('payments', ['status'], {
      name: 'idx_payments_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  },
};

