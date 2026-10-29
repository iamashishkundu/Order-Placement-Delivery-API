'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword@123';

    // Idempotency check: see if admin already exists
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM "admins" WHERE "email" = :adminEmail LIMIT 1;`,
      {
        replacements: { adminEmail },
      }
    );

    if (existing && existing.length > 0) {
      console.log(`Admin user with email ${adminEmail} already exists. Skipping seed.`);
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    await queryInterface.sequelize.query(
      `INSERT INTO "admins" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :adminEmail, :passwordHash, 'Super Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      {
        replacements: {
          adminEmail,
          passwordHash,
        },
      }
    );

    console.log(`Admin user ${adminEmail} created successfully.`);
  },

  down: async (queryInterface) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await queryInterface.sequelize.query(
      `DELETE FROM "admins" WHERE "email" = :adminEmail;`,
      {
        replacements: { adminEmail },
      }
    );
  },
};

