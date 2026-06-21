import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

// A restaurant BRANCH (филиал). Historically named "RestaurantAddress" (a simple address
// list); now it's the operational unit an order is fulfilled by. Each branch carries its
// own kitchen channel + config (deviceToken / printer), so dispatch keys on the branch.
// Menu and couriers stay at the restaurant level (shared across branches).
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
    // Human label for the branch (e.g. "Центр", "Арабкир"). Falls back to address in UI.
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    comment: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    // Kitchen channel for THIS branch (Adapter/Strategy). Same meaning as on Restaurant.
    deliveryChannel: {
      type: DataTypes.ENUM('client', 'iiko', 'rkeeper'),
      allowNull: false,
      defaultValue: 'client',
    },
    // Per-branch channel secrets/config: { deviceToken } | { printer } | iiko/rkeeper creds.
    // Never expose in public responses.
    channelConfig: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'RestaurantAddress',
    tableName: 'restaurant_addresses',
    indexes: [{ fields: ['restaurant_id'] }],
  }
);

export default RestaurantAddress;
