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
  RESTAURANT_ID='e81b0277-4e7f-45f1-907b-991ce60f3e12',
  DEVICE_TOKEN='', // empty is fine: a restaurant with no channelConfig.deviceToken accepts any
  PRINTER_IP='192.168.240.23',
  PRINTER_IPS='', // optional: several printers, comma-separated. Same ticket goes to ALL.
  PRINTER_PORT = '9100',
  PRINTER_TYPE = 'epson',
  PRINTER_CHARSET = 'PC866_CYRILLIC2',
  POLL_INTERVAL_MS = '4000',
} = process.env;

const log = (...a) => console.log(new Date().toISOString(), ...a);

// Build the list of printer targets. Each gets the SAME full ticket (kitchen + bar both
// print the whole order — no splitting). Configure either:
//   PRINTER_IPS=192.168.240.23,192.168.240.30        (one or many, "ip" or "ip:port")
// or the single PRINTER_IP (back-compat). Empty PRINTER_IPS → just PRINTER_IP.
const DEFAULT_PORT = Number(PRINTER_PORT) || 9100;
const PRINTERS = (PRINTER_IPS.trim() || PRINTER_IP)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((entry) => {
    const [ip, port] = entry.split(':');
    return { ip: ip.trim(), port: Number(port) || DEFAULT_PORT };
  });

if (!API_URL || !RESTAURANT_ID || PRINTERS.length === 0) {
  console.error('Missing config. Required: API_URL, RESTAURANT_ID, and PRINTER_IP (or PRINTER_IPS)');
  process.exit(1);
}

const base = API_URL.replace(/\/$/, '');
const tokenQ = `token=${encodeURIComponent(DEVICE_TOKEN)}`;
const pendingUrl = `${base}/kitchen/restaurants/${RESTAURANT_ID}/pending?${tokenQ}`;
const ackUrl = `${base}/kitchen/restaurants/${RESTAURANT_ID}/ack`;
const POLL_MS = Number(POLL_INTERVAL_MS) || 4000;

// ── printing ──────────────────────────────────────────────────────
const money = (v) => Number(v ?? 0).toFixed(2);

// Print the full ticket to ONE printer target ({ ip, port }).
async function printOrder(p, target) {
  const { ThermalPrinter, PrinterTypes, CharacterSet } = await import('node-thermal-printer');
  // node-thermal-printer's CharacterSet are CODE PAGES (PC437_USA, PC866_CYRILLIC2, ...),
  // NOT 'utf-8'. An unknown/empty name → undefined → iconv throws "Encoding not recognized:
  // 'undefined'". Always resolve to a VALID code page: env override if valid, else
  // PC866_CYRILLIC2 (CP866 — renders the Russian ticket text). NOTE the trailing "2":
  // this library has no "PC866_CYRILLIC" key, only "PC866_CYRILLIC2".
  const charset = (PRINTER_CHARSET && CharacterSet[PRINTER_CHARSET]) || CharacterSet.PC866_CYRILLIC2;
  const printer = new ThermalPrinter({
    type: PRINTER_TYPE === 'star' ? PrinterTypes.STAR : PrinterTypes.EPSON,
    interface: `tcp://${target.ip}:${target.port}`,
    characterSet: charset,
    removeSpecialCharacters: false,
    options: { timeout: Number(process.env.PRINTER_TIMEOUT) || 8000 },
  });

  if (!(await printer.isPrinterConnected())) {
    throw new Error(`printer unreachable at ${target.ip}:${target.port}`);
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
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({ orderId, status: 'accepted' }),
    });
    if (!res.ok) log('ack failed', res.status);
  } catch (e) {
    log('ack error', e.message);
  }
}

// (order,printer) pairs printed this session — guards against double-printing in the
// window before the ack lands, AND lets a retry hit only the printers that failed (so a
// dead bar printer never reprints the kitchen ticket). Lost on restart, intentionally:
// better to reprint an unacked order than to miss one.
const printed = new Set();
const tkey = (orderId, t) => `${orderId}@${t.ip}:${t.port}`;

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
    // Only print to the printers that haven't got this order yet.
    const targets = PRINTERS.filter((t) => !printed.has(tkey(order.id, t)));
    if (targets.length === 0) {
      // Every printer already has it, but it's still in /pending → ack didn't land. Retry ack.
      await ack(order.id);
      continue;
    }

    log(`order #${order.code} received — printing on ${targets.length} printer(s)`);
    // Same full ticket to every target, in parallel.
    const results = await Promise.allSettled(
      targets.map(async (t) => {
        await printOrder(order, t);
        printed.add(tkey(order.id, t));
      }),
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length === 0) {
      log(`order #${order.code} printed`);
      await ack(order.id); // confirm only after ALL printers succeeded
    } else {
      // Some printer failed → don't ack; the order stays pending and the failed printers
      // are retried next poll (the ones that succeeded are skipped via `printed`).
      const why = failed.map((f) => f.reason?.message || f.reason).join('; ');
      log(`print FAILED for #${order.code} on ${failed.length}/${targets.length}: ${why} (will retry next poll)`);
    }
  }
}

async function main() {
  const printerList = PRINTERS.map((t) => `${t.ip}:${t.port}`).join(', ');
  log(`print-agent starting (poll ${POLL_MS}ms) · restaurant=${RESTAURANT_ID} · printers=[${printerList}] · api=${base}`);
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
