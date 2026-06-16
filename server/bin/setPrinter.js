#!/usr/bin/env node
// Configure a restaurant's kitchen channel + printer from the CLI.
//
//   node -r dotenv/config bin/setPrinter.js                         → list restaurants
//   node -r dotenv/config bin/setPrinter.js <restaurantId> <ip> [port]
//
// Example:
//   node -r dotenv/config bin/setPrinter.js 1234-... 192.168.240.23 9100
import dotenv from 'dotenv';
import { Restaurant } from '../models/index.js';

dotenv.config();

const [, , restaurantId, ip, portArg] = process.argv;

try {
  if (!restaurantId) {
    const list = await Restaurant.findAll({ attributes: ['id', 'name', 'deliveryChannel', 'channelConfig'] });
    console.log('Restaurants:');
    for (const r of list) {
      const p = r.channelConfig?.printer;
      console.log(`  ${r.id}  |  ${r.name}  |  channel=${r.deliveryChannel}  |  printer=${p ? `${p.ip}:${p.port ?? 9100}` : '—'}`);
    }
    console.log('\nUsage: node -r dotenv/config bin/setPrinter.js <restaurantId> <printerIp> [port]');
    process.exit(0);
  }

  if (!ip) {
    console.error('Missing printer IP. Usage: ... <restaurantId> <printerIp> [port]');
    process.exit(1);
  }

  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    console.error('Restaurant not found:', restaurantId);
    process.exit(1);
  }

  const port = Number(portArg) || 9100;
  const channelConfig = { ...(restaurant.channelConfig || {}), printer: { ip, port } };
  await restaurant.update({ deliveryChannel: 'client', channelConfig });

  console.log(`OK — ${restaurant.name}: channel=client, printer=${ip}:${port}`);
  process.exit(0);
} catch (error) {
  console.error('Failed:', error?.message || error);
  process.exit(1);
}
