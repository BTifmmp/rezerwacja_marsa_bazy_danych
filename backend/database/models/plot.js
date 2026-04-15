'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Plot extends Model {}

  Plot.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      reserved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'clients',
          key: 'id'
        }
      },
      price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      size: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Plot',
      tableName: 'plots',
      timestamps: false
    }
  );

  Plot.associate = models => {
    Plot.belongsTo(models.Client, { foreignKey: 'reserved_by', onDelete: 'RESTRICT' });
    Plot.hasMany(models.Reservation, { foreignKey: 'plot_id', onDelete: 'RESTRICT' });
  };

  return Plot;
};
