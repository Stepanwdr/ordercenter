import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class Restaurant extends Model {}

Restaurant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Restaurant',
    tableName: 'restaurants',
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['name'] },
      { fields: ['lat', 'lng'] },
    ],
  }
);

export default Restaurant;
