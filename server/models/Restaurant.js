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
    phone:{
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING(1024),
      allowNull: true,
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
    // How orders for this restaurant reach the kitchen. The order dispatcher
    // selects an adapter by this value (Adapter/Strategy). 'client' = our own
    // tablet/mini-PC over SSE (universal fallback). Default for the MVP.
    deliveryChannel: {
      type: DataTypes.ENUM('client', 'iiko', 'rkeeper'),
      allowNull: false,
      defaultValue: 'client',
    },
    // Per-channel configuration: secrets/ids for the chosen adapter.
    //   client : { deviceToken }
    //   iiko   : { apiLogin, organizationId, terminalGroupId, baseUrl }
    //   rkeeper: { token, objectId, baseUrl }
    // Never expose this in client-facing responses.
    channelConfig: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Restaurant',
    tableName: 'restaurants',
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['name'] },
      { fields: [{ name: 'photo', length: 255 }], },
      { fields: ['lat', 'lng'] },
    ],
  }
);

export default Restaurant;
