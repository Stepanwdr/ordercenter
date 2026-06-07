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
    telegramId: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    telegram_link_token: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    telegram_link_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  status: {
      type: DataTypes.ENUM(courierStatuses),
      allowNull: false,
      defaultValue: 'free',
    },
    maxOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
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
