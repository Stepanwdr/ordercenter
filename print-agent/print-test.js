#!/usr/bin/env node
// Zero-dependency LAN print test. Run from a machine on the SAME network as the printer:
//   PRINTER_IP=192.168.240.23 node print-test.js
// Sends a small ESC/POS ticket over RAW TCP:9100, feeds, beeps, and cuts.
// ASCII-only text so it prints cleanly regardless of the printer's codepage.
import net from 'node:net';

const IP = process.env.PRINTER_IP || '192.168.240.23';
const PORT = Number(process.env.PRINTER_PORT) || 9100;

const ESC = 0x1b;
const GS = 0x1d;
const out = [];
const raw = (...b) => out.push(...b);
const text = (s) => { for (const byte of Buffer.from(s, 'ascii')) out.push(byte); };

raw(ESC, 0x40);            // initialize
raw(ESC, 0x61, 0x01);      // align center
raw(ESC, 0x21, 0x30);      // double width/height
text('TEST PRINT\n');
raw(ESC, 0x21, 0x00);      // normal
text('Order Center\n');
raw(ESC, 0x61, 0x00);      // align left
raw(0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x0a); // ---- line
text(`Printer: ${IP}:${PORT}\n`);
text(`Time:    ${new Date().toLocaleString()}\n`);
text('LAN connection OK\n');
raw(0x0a, 0x0a, 0x0a, 0x0a); // feed
raw(ESC, 0x42, 0x03, 0x02);  // buzzer (ESC B n t) — ignored if no buzzer
raw(GS, 0x56, 0x00);         // full cut (GS V 0)

const buf = Buffer.from(out);
console.log(`connecting to ${IP}:${PORT} ...`);

const sock = net.connect(PORT, IP);
sock.setTimeout(5000);
sock.on('connect', () => {
  console.log(`connected — sending ${buf.length} bytes`);
  sock.write(buf, () => sock.end());
});
sock.on('close', () => console.log('done — check the printer for a ticket'));
sock.on('timeout', () => { console.error('TIMEOUT — printer not reachable on the LAN'); sock.destroy(); process.exit(1); });
sock.on('error', (e) => { console.error('FAILED:', e.message); process.exit(1); });
