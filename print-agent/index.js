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
  API_URL,
  RESTAURANT_ID,
  DEVICE_TOKEN,
  PRINTER_IP,
  PRINTER_PORT = '9100',
  PRINTER_TYPE = 'epson',
  PRINTER_CHARSET,
} = process.env;

const log = (...a) => console.log(new Date().toISOString(), ...a);

if (!API_URL || !RESTAURANT_ID || !DEVICE_TOKEN || !PRINTER_IP) {
  console.error('Missing config. Required: API_URL, RESTAURANT_ID, DEVICE_TOKEN, PRINTER_IP');
  process.exit(1);
}

const base = API_URL.replace(/\/$/, '');
const streamUrl = `${base}/kitchen/restaurants/${RESTAURANT_ID}/stream?token=${encodeURIComponent(DEVICE_TOKEN)}`;
const ackUrl = `${base}/kitchen/restaurants/${RESTAURANT_ID}/ack`;

// ── printing ──────────────────────────────────────────────────────
const money = (v) => Number(v ?? 0).toFixed(2);

async function printOrder(p) {
  const { ThermalPrinter, PrinterTypes, CharacterSet } = await import('node-thermal-printer');
  const printer = new ThermalPrinter({
    type: PRINTER_TYPE === 'star' ? PrinterTypes.STAR : PrinterTypes.EPSON,
    interface: `tcp://${PRINTER_IP}:${PRINTER_PORT}`,
    characterSet: PRINTER_CHARSET ? CharacterSet[PRINTER_CHARSET] : undefined,
    removeSpecialCharacters: false,
    options: { timeout: 4000 },
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

async function onOrder(payload) {
  log(`order #${payload.code} received — printing`);
  try {
    await printOrder(payload);
    log(`order #${payload.code} printed`);
    await ack(payload.id); // confirm only after a successful print
  } catch (e) {
    // Don't ack: the order stays 'sent' and the server replays it on reconnect.
    log(`print FAILED for #${payload.code}: ${e.message} (will retry on reconnect)`);
  }
}

// ── SSE client over fetch (no extra dependency) ───────────────────
function dispatchFrame(frame) {
  let event = 'message';
  const dataLines = [];
  for (const raw of frame.split('\n')) {
    if (!raw || raw.startsWith(':')) continue; // heartbeat / comment
    const i = raw.indexOf(':');
    const field = i === -1 ? raw : raw.slice(0, i);
    const value = i === -1 ? '' : raw.slice(i + 1).replace(/^ /, '');
    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }
  if (!dataLines.length) return;
  const data = dataLines.join('\n');
  if (event === 'order:new') {
    let payload;
    try { payload = JSON.parse(data); } catch { return; }
    onOrder(payload);
  } else if (event === 'ready') {
    log('stream ready');
  }
}

async function streamOnce() {
  const res = await fetch(streamUrl, { headers: { Accept: 'text/event-stream' } });
  if (!res.ok || !res.body) throw new Error(`stream HTTP ${res.status}`);
  log('connected to order stream');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) throw new Error('stream closed');
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      dispatchFrame(buf.slice(0, idx));
      buf = buf.slice(idx + 2);
    }
  }
}

async function main() {
  log(`print-agent starting · restaurant=${RESTAURANT_ID} · printer=${PRINTER_IP}:${PRINTER_PORT}`);
  let attempt = 0;
  for (;;) {
    try {
      await streamOnce();
      attempt = 0;
    } catch (e) {
      const delay = Math.min(15000, 1000 * 2 ** attempt);
      attempt += 1;
      log(`stream error: ${e.message} — reconnecting in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

main();
