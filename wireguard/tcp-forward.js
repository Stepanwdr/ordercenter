#!/usr/bin/env node
// Tiny TCP forwarder for the restaurant PC. Listens on :9100 (incl. the WireGuard IP)
// and relays to the local printer. The cloud backend prints to the PC's WG IP:9100,
// this forwards it to the printer on the LAN. No dependencies.
//
// Run on the PC that has the printer, AFTER WireGuard is up:
//   PRINTER_IP=192.168.1.50 node tcp-forward.js
//
// Then set on the backend:  channelConfig.printer.ip = "<this PC's WG IP, e.g. 10.8.0.2>"
import net from 'node:net';

const LISTEN_PORT = Number(process.env.LISTEN_PORT || 9100);
const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.50';
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100);

const server = net.createServer((client) => {
  const upstream = net.connect(PRINTER_PORT, PRINTER_IP);
  const close = () => { client.destroy(); upstream.destroy(); };
  client.pipe(upstream);
  upstream.pipe(client);
  client.on('error', close);
  upstream.on('error', close);
  client.on('close', () => upstream.destroy());
  upstream.on('close', () => client.destroy());
});

server.on('error', (e) => { console.error('forwarder error:', e.message); process.exit(1); });
server.listen(LISTEN_PORT, () => {
  console.log(`TCP forward :${LISTEN_PORT}  ->  ${PRINTER_IP}:${PRINTER_PORT}`);
});
