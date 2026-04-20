import Sequelize, { Op } from 'sequelize';
import Promise from 'bluebird';
import dotenv from 'dotenv';

// Настройка .env
dotenv.config();

// Используем Bluebird для промисов
Sequelize.Promise = Promise;
const {
  MYSQL_NAME, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT,
} = process.env;

// Алиасы операторов (если нужны старые варианты)
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
};

// Создание экземпляра Sequelize
const sequelize = new Sequelize(MYSQL_NAME, MYSQL_USERNAME, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  dialect: 'mysql',
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_GENERAL_CI',
    timestamps: true,
  },
  // logging: true,
  logging: false,
  operatorsAliases,
});
// Проверка подключения
sequelize.authenticate()
  .then(() => {
    console.log('✅ Соединение с базой данных успешно установлено.');
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к базе:', err);
  });

export default sequelize;
