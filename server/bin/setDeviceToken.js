#!/usr/bin/env node
// Prepare a restaurant for AGENT printing (cloud deployment):
//   - generates a deviceToken (used by the print-agent's SSE auth),
//   - sets deliveryChannel = 'client',
//   - removes channelConfig.printer.ip so the CLOUD backend does NOT try to print
//     directly (it can't reach the restaurant LAN — the agent prints instead).
//
//   node -r dotenv/config bin/setDeviceToken.js              → list restaurants
//   node -r dotenv/config bin/setDeviceToken.js <restaurantId>
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { Restaurant } from '../models/index.js';

dotenv.config();

const [, , restaurantId] = process.argv;

try {
  if (!restaurantId) {
    const list = await Restaurant.findAll({ attributes: ['id', 'name', 'deliveryChannel', 'channelConfig'] });
    console.log('Restaurants:');
    for (const r of list) {
      const cc = r.channelConfig || {};
      console.log(`  ${r.id}  |  ${r.name}  |  channel=${r.deliveryChannel}  |  deviceToken=${cc.deviceToken ? 'set' : '—'}  |  printer=${cc.printer?.ip ?? '—'}`);
    }
    console.log('\nUsage: node -r dotenv/config bin/setDeviceToken.js <restaurantId>');
    process.exit(0);
  }

  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    console.error('Restaurant not found:', restaurantId);
    process.exit(1);
  }

  const token = crypto.randomBytes(24).toString('hex');
  const channelConfig = { ...(restaurant.channelConfig || {}), deviceToken: token };
  // Agent mode: the cloud must NOT print directly, so drop any printer config.
  delete channelConfig.printer;
  await restaurant.update({ deliveryChannel: 'client', channelConfig });

  console.log(`OK — ${restaurant.name}: channel=client, agent mode (no direct print).`);
  console.log(`\nPut this in the restaurant's print-agent/.env:`);
  console.log(`  RESTAURANT_ID=${restaurant.id}`);
  console.log(`  DEVICE_TOKEN=${token}`);
  process.exit(0);
} catch (error) {
  console.error('Failed:', error?.message || error);
  process.exit(1);
}
