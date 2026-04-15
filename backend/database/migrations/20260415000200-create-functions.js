'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION fn_plots_sold_between(p_start_date TIMESTAMP, p_end_date TIMESTAMP)
      RETURNS TABLE (
          time_of_transaction TIMESTAMP,
          client_name VARCHAR(255),
          plot_id INT,
          amount DECIMAL(15, 2),
          size DECIMAL(15, 2)
      ) AS $$
          SELECT
              r.created_at,
              c.name || ' ' || c.last_name,
              r.plot_id,
              ABS(r.balance_change),
              p.size
          FROM reservations r
          JOIN clients c ON r.client_id = c.id
          JOIN plots p ON r.plot_id = p.id
          WHERE r.operation = 'add'
              AND r.created_at BETWEEN p_start_date AND p_end_date
              AND NOT EXISTS (
                  SELECT 1 FROM reservations r2
                  WHERE r2.client_id = r.client_id
                    AND r2.plot_id = r.plot_id
                    AND r2.operation = 'remove'
                    AND r2.created_at > r.created_at
              )
          ORDER BY r.created_at DESC;
      $$ LANGUAGE sql;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS fn_plots_sold_between(TIMESTAMP, TIMESTAMP);
    `);
  }
};
