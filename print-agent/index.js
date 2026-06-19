#!/usr/bin/env node
// Kitchen print agent — runs on the mini-PC INSIDE the restaurant (same LAN as the
// printer). It subscribes to the cloud SSE order stream, prints each new order on the
// local thermal printer (ESC/POS over RAW TCP:9100), and acks back to the cloud.
//
// Why an agent: a cloud backend can't reach a printer behind the restaurant's NAT.
// The tablet/mini-PC connects OUT to the cloud (SSE traverses NAT fine), then prints
// LOCALLY. Zero inbound exposure.
//
// Config via environment (or a .env file next to this script):
//   API_URL        e.g. https://api.deliverydepartment.am
//   RESTAURANT_ID  the restaurant's id
//   DEVICE_TOKEN   restaurant.channelConfig.deviceToken
//   PRINTER_IP     LAN ip of the Xprinter / PP8800 (e.g. 192.168.1.50)
//   PRINTER_PORT   default 9100
//   PRINTER_TYPE   epson (default) | star
//   PRINTER_CHARSET optional node-thermal-printer CharacterSet key

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ── tiny .env loader (no dependency) ──────────────────────────────
const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^\s*([\w.-]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#')) {
      const v = m[2].replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  }
}

const {
  API_URL='https://api.deliverydepartment.am',
  RESTAURANT_ID='',
  DEVICE_TOKEN='', // empty is fine: a restaurant with no channelConfig.deviceToken accepts any
  PRINTER_IP='192.168.240.23',
  PRINTER_PORT = '9100',
  PRINTER_TYPE = 'epson',
  PRINTER_CHARSET='',
  POLL_INTERVAL_MS = '4000',
} = process.env;

const log = (...a) => console.log(new Date().toISOString(), ...a);

if (!API_URL || !RESTAURANT_ID || !PRINTER_IP) {
  console.error('Missing config. Required: API_URL, RESTAURANT_ID, PRINTER_IP');
  process.exit(1);
}

const base = API_URL.replace(/\/$/, '');
const tokenQ = `token=${encodeURIComponent(DEVICE_TOKEN)}`;
const pendingUrl = `${base}/kitchen/restaurants/${RESTAURANT_ID}/pending?${tokenQ}`;
const ackUrl = `${base}/kitchen/restaurants/${RESTAURANT_ID}/ack`;
const POLL_MS = Number(POLL_INTERVAL_MS) || 4000;

// ── printing ──────────────────────────────────────────────────────
const money = (v) => Number(v ?? 0).toFixed(2);

async function printOrder(p) {
  const { ThermalPrinter, PrinterTypes, CharacterSet } = await import('node-thermal-printer');
  // node-thermal-printer's CharacterSet are CODE PAGES (PC437_USA, PC866_CYRILLIC, ...),
  // NOT 'utf-8'. An unknown/empty name → undefined → iconv throws "Encoding not recognized:
  // 'undefined'". Always resolve to a VALID code page: env override if valid, else PC866
  // (DOS Cyrillic — renders the Russian ticket text; safe ASCII fallback too).
  const charset = (PRINTER_CHARSET && CharacterSet[PRINTER_CHARSET]) || CharacterSet.PC866_CYRILLIC;
  const printer = new ThermalPrinter({
    type: PRINTER_TYPE === 'star' ? PrinterTypes.STAR : PrinterTypes.EPSON,
    interface: `tcp://${PRINTER_IP}:${PRINTER_PORT}`,
    characterSet: charset,
    removeSpecialCharacters: false,
    options: { timeout: Number(process.env.PRINTER_TIMEOUT) || 8000 },
  });

  if (!(await printer.isPrinterConnected())) {
    throw new Error(`printer unreachable at ${PRINTER_IP}:${PRINTER_PORT}`);
  }

  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(`#${p.code}`);
  printer.bold(false);
  printer.setTextNormal();
  if (p.createdAt) printer.println(new Date(p.createdAt).toLocaleString('ru-RU'));
  if (p.orderType) printer.println(String(p.orderType).toUpperCase());
  printer.drawLine();

  printer.alignLeft();
  if (p.customer?.name) printer.println(`Гость: ${p.customer.name}`);
  if (p.customer?.phone) printer.println(`Тел:   ${p.customer.phone}`);
  if (p.delivery?.address) printer.println(`Адрес: ${p.delivery.address}`);
  if (p.delivery?.comment) printer.println(`Комм.: ${p.delivery.comment}`);
  printer.drawLine();

  for (const it of p.items || []) {
    printer.bold(true);
    printer.leftRight(`${it.quantity} x ${it.name ?? ''}`, money(it.price * it.quantity));
    printer.bold(false);
    for (const mod of it.modifiers || []) {
      printer.println(`   + ${typeof mod === 'string' ? mod : mod?.name ?? ''}`);
    }
  }
  printer.drawLine();

  if (Number(p.delivery?.fee) > 0) printer.leftRight('Доставка:', money(p.delivery.fee));
  printer.alignRight();
  printer.bold(true);
  printer.println(`ИТОГО: ${money(p.total)}`);
  printer.bold(false);
  if (p.payment?.method) {
    printer.alignLeft();
    printer.println(`Оплата: ${p.payment.method}${p.payment.paid ? ' (оплачен)' : ''}`);
  }

  printer.newLine();
  try { printer.beep(); } catch { /* model may have no buzzer */ }
  printer.cut();

  await printer.execute();
}

async function ack(orderId) {
  try {
    const res = await fetch(ackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-token': DEVICE_TOKEN },
      body: JSON.stringify({ orderId, status: 'accepted' }),
    });
    if (!res.ok) log('ack failed', res.status);
  } catch (e) {
    log('ack error', e.message);
  }
}

// Orders printed this session — guards against double-printing in the window between a
// successful print and the ack landing on the server (the order is still in /pending
// until then). Lost on restart, which is intentional: better to reprint an unacked order
// than to miss one.
const printed = new Set();

// ── polling transport ─────────────────────────────────────────────
// Why polling, not SSE: shared hosting (LiteSpeed/Passenger) cuts long-lived streaming
// connections (UND_ERR_SOCKET), so the SSE stream is unreliable. A short GET every few
// seconds passes through any proxy untouched.
async function pollOnce() {
  const res = await fetch(pendingUrl, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`pending HTTP ${res.status}`);
  const body = await res.json();
  const orders = Array.isArray(body?.data) ? body.data : [];

  for (const order of orders) {
    if (printed.has(order.id)) {
      // Printed already, but still in /pending → the earlier ack didn't land. Retry the
      // ack only; never reprint.
      await ack(order.id);
      continue;
    }
    log(`order #${order.code} received — printing`);
    try {
      await printOrder(order);
      printed.add(order.id);
      log(`order #${order.code} printed`);
      await ack(order.id); // confirm only after a successful print
    } catch (e) {
      // Don't ack: the order stays pending and is retried on the next poll.
      log(`print FAILED for #${order.code}: ${e.message} (will retry next poll)`);
    }
  }
}

async function main() {
  log(`print-agent starting (poll ${POLL_MS}ms) · restaurant=${RESTAURANT_ID} · printer=${PRINTER_IP}:${PRINTER_PORT} · api=${base}`);
  for (;;) {
    try {
      await pollOnce();
    } catch (e) {
      // fetch() hides the real reason in error.cause (DNS / refused / TLS / socket).
      const reason = e?.cause?.code || e?.cause?.message || e?.message;
      log(`poll error: ${reason} (${base}) — retrying in ${POLL_MS}ms`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main();
