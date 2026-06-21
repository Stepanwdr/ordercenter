import sequelize from '../services/sequelize.js';
import User from './User.js';
import Restaurant from './Restaurant.js';
import Courier from './Courier.js';
import Order from './Order.js';
import RefreshToken from './RefreshToken.js';
import Menu from './Menu.js';
import MenuItem from './MenuItem.js';
import Category from './Category.js';
import OrderItem from './OrderItem.js';
import RestaurantAddress from './RestaurantAddress.js';

User.hasMany(Restaurant, {
  as: 'ownedRestaurants',
  foreignKey: 'ownerId',
});

Restaurant.belongsTo(User, {
  as: 'owner',
  foreignKey: 'ownerId',
});

// Courier <-> Restaurant associations
Restaurant.hasMany(Courier, {
  as: 'couriers',
  foreignKey: 'restaurantId',
});

Courier.belongsTo(Restaurant, {
  as: 'restaurant',
  foreignKey: 'restaurantId',
});

User.hasOne(Courier, {
  as: 'courierProfile',
  foreignKey: 'userId',
});

Courier.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

Order.belongsTo(User, {
  as: 'operator',
  foreignKey: 'operatorId',
});

User.hasMany(Order, {
  as: 'courierOrders',
  foreignKey: 'courierId',
});

Order.belongsTo(User, {
  as: 'courier',
  foreignKey: 'courierId',
});

// Allow including courier profile (from Courier table) by linking Order.courierId -> Courier.userId
Order.belongsTo(Courier, {
  as: 'courierProfile',
  foreignKey: 'courierId',
  targetKey: 'userId',
});

Restaurant.hasMany(Order, {
  as: 'orders',
  foreignKey: 'restaurantId',
});

Order.belongsTo(Restaurant, {
  as: 'restaurant',
  foreignKey: 'restaurantId',
});

User.hasMany(RefreshToken, {
  as: 'refreshTokens',
  foreignKey: 'userId',
});

RefreshToken.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

// Menu related associations
Restaurant.hasMany(Menu, {
  as: 'menus',
  foreignKey: 'restaurantId',
});

Menu.belongsTo(Restaurant, {
  as: 'restaurant',
  foreignKey: 'restaurantId',
});

Menu.hasMany(MenuItem, {
  as: 'items',
  foreignKey: 'menuId',
});

MenuItem.belongsTo(Menu, {
  as: 'menu',
  foreignKey: 'menuId',
});

Category.hasMany(MenuItem, {
  as: 'menuItems',
  foreignKey: 'categoryId',
});

MenuItem.belongsTo(Category, {
  as: 'category',
  foreignKey: 'categoryId',
});

// Order items associations
Order.hasMany(OrderItem, {
  as: 'orderItems',
  foreignKey: 'orderId',
});

OrderItem.belongsTo(Order, {
  as: 'order',
  foreignKey: 'orderId',
});

OrderItem.belongsTo(MenuItem, {
  as: 'menuItem',
  foreignKey: { name: 'menuItemId', allowNull: true },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// RestaurantAddress (= branch / филиал) associations
Restaurant.hasMany(RestaurantAddress, {
  as: 'addresses',
  foreignKey: 'restaurantId',
});

RestaurantAddress.belongsTo(Restaurant, {
  as: 'restaurant',
  foreignKey: 'restaurantId',
});

// An order is fulfilled by one branch; a branch has many orders.
RestaurantAddress.hasMany(Order, {
  as: 'orders',
  foreignKey: 'branchId',
});

Order.belongsTo(RestaurantAddress, {
  as: 'branch',
  foreignKey: 'branchId',
});

// (duplicate courier associations removed to avoid conflicts)


export {
  sequelize,
  User,
  Restaurant,
  Courier,
  Order,
  RefreshToken,
  Menu,
  MenuItem,
  Category,
  OrderItem,
  RestaurantAddress
};
