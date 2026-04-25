import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class Courier extends Model {}

Courier.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('offline', 'available', 'busy'),
      allowNull: false,
      defaultValue: 'offline',
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Courier',
    tableName: 'couriers',
    indexes: [
      { fields: ['status'] },
      { fields: ['lat', 'lng'] },
    ],
  }
);

export default Courier;
