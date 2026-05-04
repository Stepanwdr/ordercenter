import sequelize from '../services/sequelize.js';
import User from './User.js';
import Restaurant from './Restaurant.js';
import Courier from './Courier.js';
import Order from './Order.js';
import RefreshToken from './RefreshToken.js';
import Menu from './Menu.js';
import MenuItem from './MenuItem.js';
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

User.hasOne(Courier, {
  as: 'courierProfile',
  foreignKey: 'userId',
});

Courier.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

User.hasMany(Order, {
  as: 'customerOrders',
  foreignKey: 'customerId',
});

Order.belongsTo(User, {
  as: 'customer',
  foreignKey: 'customerId',
});

User.hasMany(Order, {
  as: 'courierOrders',
  foreignKey: 'courierId',
});

Order.belongsTo(User, {
  as: 'courier',
  foreignKey: 'courierId',
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
  foreignKey: 'menuItemId',
});

// RestaurantAddress associations
Restaurant.hasMany(RestaurantAddress, {
  as: 'addresses',
  foreignKey: 'restaurantId',
});

RestaurantAddress.belongsTo(Restaurant, {
  as: 'restaurant',
  foreignKey: 'restaurantId',
});

export {
  sequelize,
  User,
  Restaurant,
  Courier,
  Order,
  RefreshToken,
  Menu,
  MenuItem,
  OrderItem,
  RestaurantAddress
};
