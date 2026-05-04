import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class RestaurantAddress extends Model {}

RestaurantAddress.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    street: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    building: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    apartment: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    comment: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'RestaurantAddress',
    tableName: 'restaurant_addresses',
  }
);

export default RestaurantAddress;
