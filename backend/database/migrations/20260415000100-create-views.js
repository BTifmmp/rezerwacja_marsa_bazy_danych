'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW v_available_plots AS
      SELECT * FROM plots
      WHERE reserved_by IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW v_client_summary AS
      SELECT
          c.id AS client_id,
          c.name || ' ' || c.last_name AS full_name,
          c.balance AS current_account_balance,
          COUNT(p.id) AS plots_owned_count,
          COALESCE(SUM(p.size), 0) AS total_size,
          SUM(r.balance_change) AS total_paid
      FROM clients c
      LEFT JOIN plots p ON c.id = p.reserved_by
      LEFT JOIN reservations r ON c.id = r.client_id
      GROUP BY c.id, c.name, c.last_name, c.balance;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS v_client_summary;`);
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS v_available_plots;`);
  }
};
