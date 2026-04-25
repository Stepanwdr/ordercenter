#!/usr/bin/env node
import dotenv from 'dotenv';
import { Courier, Order, RefreshToken, Restaurant, User, sequelize } from '../models/index.js';
import { hashPassword } from '../utils/password.js';

dotenv.config();

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  await RefreshToken.destroy({ where: {}, force: true });
  await Order.destroy({ where: {}, force: true });
  await Courier.destroy({ where: {}, force: true });
  await Restaurant.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  const password = await hashPassword('Password123');

  const [admin, operator, courierUser, customer] = await Promise.all([
    User.unscoped().create({ email: 'admin@example.com', password, role: 'admin' }),
    User.unscoped().create({ email: 'operator@example.com', password, role: 'operator' }),
    User.unscoped().create({ email: 'courier@example.com', password, role: 'courier' }),
    User.unscoped().create({ email: 'customer@example.com', password, role: 'customer' }),
  ]);

  await Courier.create({
    userId: courierUser.id,
    status: 'available',
    lat: 40.1772000,
    lng: 44.5034900,
  });

  const restaurant = await Restaurant.create({
    name: 'Central Kitchen',
    ownerId: operator.id,
    lat: 40.1792000,
    lng: 44.4991000,
  });

  await Order.create({
    status: 'pending',
    price: 18.5,
    customerId: customer.id,
    restaurantId: restaurant.id,
  });

  console.log('Seed completed successfully.');
  console.log('Users: admin@example.com / operator@example.com / courier@example.com / customer@example.com');
  console.log('Password for all users: Password123');
  process.exit(0);
} catch (error) {
  console.error('Failed to seed database.', error);
  process.exit(1);
}
