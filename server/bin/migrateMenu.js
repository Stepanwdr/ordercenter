#!/usr/bin/env node
import dotenv from 'dotenv';
import { Menu, MenuItem, Restaurant, sequelize } from '../models/index.js';

dotenv.config();

try {
  await sequelize.authenticate();
  // Synchronize only menu-related models
  await Menu.sync({ alter: true });
  await MenuItem.sync({ alter: true });
  console.log('Menu-related tables synchronized successfully.');
  process.exit(0);
} catch (error) {
  console.error('Failed to synchronize menu schema.', error);
  process.exit(1);
}
