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
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    indexes: [
      { unique: true, fields: ['name'] },
      { unique: true, fields: ['slug'] },
    ],
  }
);

export default Category;
