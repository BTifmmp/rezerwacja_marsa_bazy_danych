'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Client extends Model {}

  Client.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      last_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0
      }
    },
    {
      sequelize,
      modelName: 'Client',
      tableName: 'clients',
      timestamps: false
    }
  );

  Client.associate = models => {
    Client.hasMany(models.Plot, { foreignKey: 'reserved_by', onDelete: 'RESTRICT' });
    Client.hasMany(models.Reservation, { foreignKey: 'client_id', onDelete: 'RESTRICT' });
    Client.hasMany(models.Payment, { foreignKey: 'client_id', onDelete: 'RESTRICT' });
  };

  return Client;
};
