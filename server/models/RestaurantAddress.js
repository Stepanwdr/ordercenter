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
    address: {
      type: DataTypes.STRING(512),
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
