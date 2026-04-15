'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {}

  Reservation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        }
      },
      plot_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'plots',
          key: 'id'
        }
      },
      operation: {
        type: DataTypes.ENUM('add', 'remove'),
        allowNull: false
      },
      balance_change: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Reservation',
      tableName: 'reservations',
      timestamps: false
    }
  );

  Reservation.associate = models => {
    Reservation.belongsTo(models.Client, { foreignKey: 'client_id', onDelete: 'RESTRICT' });
    Reservation.belongsTo(models.Plot, { foreignKey: 'plot_id', onDelete: 'RESTRICT' });
  };

  return Reservation;
};
