import { Model, DataTypes } from 'sequelize';
import md5 from 'md5';
import sequelize from '../services/sequelize.js';

class Users extends Model {
  static passwordHash(string) {
    return md5(`${md5(string)}_safe`);
  }
}

Users.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  // ── Google Auth ─────────────────────────────────────────────────────────────
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // ────────────────────────────────────────────────────────────────────────────

  password: {
    type: DataTypes.CHAR(32),
    allowNull: true,
    get() {
      return undefined;
    },
    set(val) {
      if (val === null || val === undefined) {
        this.setDataValue('password', null);
        return;
      }
      this.setDataValue('password', Users.passwordHash(val));
    },
  },
  phone: {
    type: DataTypes.STRING(32),
    allowNull: true,          // ← Google не даёт телефон
  },

  role: {
    type: DataTypes.ENUM('admin', 'courier', 'customer', 'operator'),
    allowNull: true,
    defaultValue: 'admin',  // ← по умолчанию пациент
  },

}, {
  sequelize,
  modelName: 'users',
  tableName: 'users',
});


export default Users;