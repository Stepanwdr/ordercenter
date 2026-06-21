import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class MenuItem extends Model {}

MenuItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    menuId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    article: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    volumeValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    volumeName: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MenuItem',
    tableName: 'menu_items',
    indexes: [
      { unique: true, fields: ['article'], name: 'article' },
      { fields: ['menu_id'] },
      { fields: ['category_id'] },
      { fields: ['quantity'] },
      { fields: ['volume_value'] },
      { fields: ['volume_name'] },
    ],
  }
);

export default MenuItem;
