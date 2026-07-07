#!/usr/bin/env node
import dotenv from 'dotenv';
import { RestaurantAddress } from '../models/index.js';

dotenv.config();

try {
  await RestaurantAddress.sync({ alter: true });
  console.log('RestaurantAddress table synchronized successfully.');
  process.exit(0);
} catch (error) {
  console.error('Failed to synchronize RestaurantAddress schema.', error);
  process.exit(1);
}
