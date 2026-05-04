#!/usr/bin/env node
import dotenv from 'dotenv';
import { sequelize } from '../models/index.js';

dotenv.config();

(async () => {
  try {
    const qi = sequelize.getQueryInterface();
    await qi.removeColumn('restaurants', 'address');
    console.log('Column "address" removed from restaurants table');
    process.exit(0);
  } catch (error) {
    console.error('Failed to remove column address from restaurants:', error?.message ?? error);
    process.exit(1);
  }
})();
