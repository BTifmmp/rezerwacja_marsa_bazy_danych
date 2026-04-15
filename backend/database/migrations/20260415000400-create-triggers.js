'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION f_update_payments() RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO payments (client_id, amount)
          VALUES (NEW.client_id, NEW.balance_change);
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION f_update_user_balance() RETURNS TRIGGER AS $$
      BEGIN
          UPDATE clients
          SET balance = balance + NEW.amount
          WHERE id = NEW.client_id;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION f_update_reserved() RETURNS TRIGGER AS $$
      BEGIN
          UPDATE plots
          SET reserved_by = NEW.client_id
          WHERE id = NEW.plot_id;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trg_update_payments
      AFTER INSERT ON reservations
      FOR EACH ROW
      EXECUTE FUNCTION f_update_payments();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trg_client_balance
      AFTER INSERT ON payments
      FOR EACH ROW
      EXECUTE FUNCTION f_update_user_balance();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trg_plot_reserved
      AFTER INSERT ON reservations
      FOR EACH ROW
      EXECUTE FUNCTION f_update_reserved();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_plot_reserved ON reservations;`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_client_balance ON payments;`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_update_payments ON reservations;`);

    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS f_update_reserved();`);
    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS f_update_user_balance();`);
    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS f_update_payments();`);
  }
};
