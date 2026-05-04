import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class Menu extends Model {}

Menu.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Menu',
    tableName: 'menus',
  }
);

export default Menu;
