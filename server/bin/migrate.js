#!/usr/bin/env node
import dotenv from 'dotenv';
import { sequelize } from '../models/index.js';

dotenv.config();

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Database schema synchronized successfully.');
  process.exit(0);
} catch (error) {
  console.error('Failed to synchronize database schema.', error);
  process.exit(1);
}
