const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');
const env = require('./env');

const dbConfig = {
  development: {
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  },
  test: {
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
};

const currentConfig = dbConfig[env.NODE_ENV] || dbConfig.development;

const sequelize = new Sequelize(
  currentConfig.database,
  currentConfig.username,
  currentConfig.password,
  {
    host: currentConfig.host,
    port: currentConfig.port,
    dialect: currentConfig.dialect,
    logging: currentConfig.logging,
    pool: currentConfig.pool || {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const models = {};

/**
 * Initializes and registers all models across role folders:
 * src/v1/modules/admin/models
 * src/v1/modules/vendor/models
 * src/v1/modules/customer/models
 *
 * Calls associate(models) on each model.
 * Never calls sync() - schema is managed ONLY by migrations.
 */
const initModels = () => {
  const roles = ['admin', 'vendor', 'customer'];
  const modulesDir = path.resolve(__dirname, '../v1/modules');

  roles.forEach((role) => {
    const modelsDir = path.join(modulesDir, role, 'models');
    if (!fs.existsSync(modelsDir)) return;

    const files = fs.readdirSync(modelsDir);
    files.forEach((file) => {
      if (file.endsWith('.model.js')) {
        const modelPath = path.join(modelsDir, file);
        const modelFactory = require(modelPath);

        let model;
        if (modelFactory && (modelFactory.prototype instanceof Model || modelFactory === Model || typeof modelFactory.init === 'function')) {
          // Already defined Sequelize Model class
          model = modelFactory;
        } else if (typeof modelFactory === 'function') {
          // Factory function (sequelize, DataTypes) => Model
          model = modelFactory(sequelize, DataTypes);
        } else {
          model = modelFactory;
        }

        if (model && model.name) {
          models[model.name] = model;
        }
      }
    });
  });

  // Call associate() on each model if defined
  Object.keys(models).forEach((modelName) => {
    if (typeof models[modelName].associate === 'function') {
      models[modelName].associate(models);
    }
  });

  return models;
};

const getModels = () => models;

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connected successfully.');
    initModels();
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    throw error;
  }
};

module.exports = {
  ...dbConfig,
  sequelize,
  Sequelize,
  connectDB,
  initModels,
  getModels,
};

