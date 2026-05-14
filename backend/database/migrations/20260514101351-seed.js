"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      INSERT INTO clients (name, last_name, balance) VALUES
      ('Alice', 'Smith', 10000),
      ('Bob', 'Johnson', 50000),
      ('Charlie', 'Williams', 20000);

      INSERT INTO plots (size, price) VALUES
      (10000, 5000),
      (700000, 10000),
      (1000000, 15000),
      (400000, 15000),
      (180000, 15000),
      (110000, 15000);
      `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE FROM clients WHERE name IN ('Alice', 'Bob', 'Charlie');
    `);
    await queryInterface.sequelize.query(`
      DELETE FROM plots WHERE size IN (10000, 700000, 1000000, 400000, 180000, 110000);
    `);
  },
};
