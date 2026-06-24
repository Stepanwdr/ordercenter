import { DataTypes, Model } from 'sequelize';
import sequelize from '../services/sequelize.js';

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // A category belongs to a menu (categories are scoped per-menu).
    menuId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    indexes: [
      // Unique per menu (so two menus can each have a "Burger" category).
      { unique: true, fields: ['menu_id', 'slug'], name: 'categories_menu_slug' },
      { fields: ['menu_id'] },
    ],
  }
);

export default Category;
