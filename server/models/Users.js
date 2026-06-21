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
    type: DataTypes.STRING(64),
    allowNull: false,
  },

  // ── Google Auth ─────────────────────────────────────────────────────────────
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
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
    type: DataTypes.ENUM('admin', 'courier', 'customer', 'operator', 'dispatcher'),
    allowNull: true,
    defaultValue: 'admin',  // ← по умолчанию пациент
  },

}, {
  sequelize,
  modelName: 'users',
  tableName: 'users',
  // Unique constraints live here (named) rather than as column-level `unique`,
  // because column-level unique makes sync({ alter: true }) re-add the index on
  // every run until MySQL hits its 64-key limit.
  indexes: [
    { unique: true, fields: ['email'], name: 'email' },
    { unique: true, fields: ['google_id'], name: 'users_google_id' },
  ],
});


export default Users;