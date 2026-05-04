import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';
import {courierStatuses} from "../utils/validators.js";

class Courier extends Model {}

Courier.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'restaurants',
        key: 'id',
      },
    },
  status: {
      type: DataTypes.ENUM(courierStatuses),
      allowNull: false,
      defaultValue: 'free',
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
