#!/usr/bin/env node
// Idempotent column migration. Adds ONLY the new columns this app introduced, using
// queryInterface.addColumn — it does NOT run sync({alter}), so it never re-creates or
// re-validates foreign keys. That avoids ER_NO_REFERENCED_ROW_2 on pre-existing orphan
// rows (e.g. a restaurant whose owner_id no longer exists in users). Safe to re-run.
//
// Column names are snake_case to match `define: { underscored: true }`.
import dotenv from 'dotenv';
import { DataTypes } from 'sequelize';
import { sequelize } from '../models/index.js';

dotenv.config();

const COLUMNS = {
  restaurants: {
    delivery_channel: { type: DataTypes.ENUM('client', 'iiko', 'rkeeper'), allowNull: false, defaultValue: 'client' },
    channel_config: { type: DataTypes.JSON, allowNull: true },
    logo: { type: DataTypes.STRING(1024), allowNull: true },
    address: { type: DataTypes.STRING(512), allowNull: true },
  },
  orders: {
    delivery_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    dispatch_status: { type: DataTypes.ENUM('pending', 'sent', 'accepted', 'failed'), allowNull: false, defaultValue: 'pending' },
    external_id: { type: DataTypes.STRING(128), allowNull: true },
    dispatched_at: { type: DataTypes.DATE, allowNull: true },
    dispatch_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    next_dispatch_at: { type: DataTypes.DATE, allowNull: true },
    // Which branch (restaurant_addresses.id) fulfills the order.
    branch_id: { type: DataTypes.UUID, allowNull: true },
  },
  // Branch (филиал) operational fields added on top of the simple address list.
  restaurant_addresses: {
    name: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(64), allowNull: true },
    photo: { type: DataTypes.STRING(1024), allowNull: true },
    lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    delivery_channel: { type: DataTypes.ENUM('client', 'iiko', 'rkeeper'), allowNull: false, defaultValue: 'client' },
    channel_config: { type: DataTypes.JSON, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  users: {
    avatar: { type: DataTypes.STRING(512), allowNull: true },
  },
  couriers: {
    max_orders: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  },
};

try {
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();

  for (const [table, cols] of Object.entries(COLUMNS)) {
    let existing;
    try {
      existing = await qi.describeTable(table);
    } catch (e) {
      console.warn(`! skip table "${table}" (describe failed): ${e.message}`);
      continue;
    }
    for (const [name, def] of Object.entries(cols)) {
      if (existing[name]) {
        console.log(`= ${table}.${name} already exists`);
        continue;
      }
      await qi.addColumn(table, name, def);
      console.log(`+ added ${table}.${name}`);
    }
  }

  console.log('Column migration complete.');
  process.exit(0);
} catch (error) {
  console.error('Column migration failed.', error?.message || error);
  process.exit(1);
}
