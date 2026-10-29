'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vendors', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isPhoneVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending',
        allowNull: false,
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      shopName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ownerName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      addressLine: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pincode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      profileCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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

    await queryInterface.addIndex('vendors', ['email'], { unique: true });
    await queryInterface.addIndex('vendors', ['phone'], { unique: true });
    await queryInterface.addIndex('vendors', ['status']);
    await queryInterface.addIndex('vendors', ['profileCompleted']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('vendors');
  },
};

