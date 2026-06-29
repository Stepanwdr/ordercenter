import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class OrderItem extends Model {}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    menuItemId: {
      // Nullable so deleting a menu item leaves the historical order line intact
      // (FK is ON DELETE SET NULL) instead of blocking the delete or orphaning the row.
      type: DataTypes.UUID,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Per-line kitchen note: special requests like "острый", "без лука".
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
  }
);

export default OrderItem;
