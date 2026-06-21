#!/usr/bin/env node
// Prepare a BRANCH (филиал) for agent printing: generate a deviceToken on the branch's
// channelConfig so its on-site print-agent authenticates with BRANCH_ID + token.
//
//   node -r dotenv/config bin/setBranchDeviceToken.js                 → list branches
//   node -r dotenv/config bin/setBranchDeviceToken.js <branchId>
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { RestaurantAddress, Restaurant } from '../models/index.js';

dotenv.config();

const [, , branchId] = process.argv;

try {
  if (!branchId) {
    const list = await RestaurantAddress.findAll({ include: [{ model: Restaurant, as: 'restaurant' }] });
    console.log('Branches:');
    for (const b of list) {
      const cc = b.channelConfig || {};
      const label = b.name || b.address || '—';
      console.log(`  ${b.id}  |  ${b.restaurant?.name ?? '?'} / ${label}  |  deviceToken=${cc.deviceToken ? 'set' : '—'}`);
    }
    console.log('\nUsage: node -r dotenv/config bin/setBranchDeviceToken.js <branchId>');
    process.exit(0);
  }

  const branch = await RestaurantAddress.findByPk(branchId);
  if (!branch) {
    console.error('Branch not found:', branchId);
    process.exit(1);
  }

  const token = crypto.randomBytes(24).toString('hex');
  const channelConfig = { ...(branch.channelConfig || {}), deviceToken: token };
  // Agent mode: the cloud must NOT print directly, so drop any printer config.
  delete channelConfig.printer;
  await branch.update({ deliveryChannel: 'client', channelConfig });

  console.log(`OK — branch "${branch.name || branch.address}": channel=client, agent mode.`);
  console.log(`\nPut this in the branch's print-agent/.env:`);
  console.log(`  BRANCH_ID=${branch.id}`);
  console.log(`  DEVICE_TOKEN=${token}`);
  process.exit(0);
} catch (error) {
  console.error('Failed:', error?.message || error);
  process.exit(1);
}
