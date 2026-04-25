import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const {
  MYSQL_HOST = '127.0.0.1',
  MYSQL_PORT = '3306',
  MYSQL_NAME = 'orderapp',
  MYSQL_USERNAME = 'root',
  MYSQL_PASSWORD = '',
  NODE_ENV = 'development',
} = process.env;

const sequelize = new Sequelize(MYSQL_NAME, MYSQL_USERNAME, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT),
  dialect: 'mysql',
  logging: NODE_ENV === 'development' ? false : false,
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  dialectOptions: {
    decimalNumbers: true,
  },
});

export default sequelize;
