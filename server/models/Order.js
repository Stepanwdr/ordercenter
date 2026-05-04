import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('pending','accepted','cooking','ready','picked_up','delivering','completed','cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    courierId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    indexes: [
      { fields: ['status'] },
      { fields: ['customer_id'] },
      { fields: ['courier_id'] },
      { fields: ['restaurant_id'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Order;
