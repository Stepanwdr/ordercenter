#!/usr/bin/env node
// Categories became per-menu. Drop the old GLOBAL unique indexes on (name) and (slug),
// add a composite unique (menu_id, slug) so each menu can have its own "Burger" category.
// Idempotent — safe to re-run. Run AFTER migrateColumns.js (which adds categories.menu_id).
import dotenv from 'dotenv';
import { sequelize } from '../models/index.js';

dotenv.config();

const qi = sequelize.getQueryInterface();
const step = async (label, fn) => {
  try {
    await fn();
    console.log(`+ ${label}`);
  } catch (e) {
    console.log(`= ${label} skipped (${e.message})`);
  }
};

try {
  await sequelize.authenticate();
  await step('drop unique categories_name', () => qi.removeIndex('categories', 'categories_name'));
  await step('drop unique categories_slug', () => qi.removeIndex('categories', 'categories_slug'));
  await step('add unique categories_menu_slug', () =>
    qi.addIndex('categories', ['menu_id', 'slug'], { unique: true, name: 'categories_menu_slug' }),
  );
  console.log('Category index migration complete.');
  process.exit(0);
} catch (error) {
  console.error('Category index migration failed.', error?.message || error);
  process.exit(1);
}
