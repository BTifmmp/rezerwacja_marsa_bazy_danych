'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {}

  Payment.init(
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
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: false
    }
  );

  Payment.associate = models => {
    Payment.belongsTo(models.Client, { foreignKey: 'client_id', onDelete: 'RESTRICT' });
  };

  return Payment;
};
