# Kitchen Print Agent

Small Node script that runs on the **mini-PC inside the restaurant** (same LAN as the
thermal printer). It connects out to the cloud API over SSE, prints each new order on
the local printer (ESC/POS over RAW TCP:9100), and acks back.

This is how printing works when the backend is **cloud-hosted**: the cloud can't reach a
printer behind the restaurant's NAT, so the in-restaurant machine prints locally. The SSE
connection is outbound (restaurant → cloud), so it traverses NAT with no port-forwarding.

## Requirements
- Node.js ≥ 18 on the mini-PC.
- The printer reachable on the LAN at `PRINTER_IP:9100` (Xprinter XP-V320N/V330N, Posiflex
  PP8800, or any ESC/POS network printer with a static IP).
- A `deviceToken` set on the restaurant: `restaurant.channelConfig.deviceToken`.

## Setup
```bash
cd print-agent
npm install
cp .env.example .env      # then edit .env
npm start
```

Fill `.env`:
- `API_URL` — cloud base, e.g. `https://api.deliverydepartment.am`
- `RESTAURANT_ID` — the restaurant's id
- `DEVICE_TOKEN` — `restaurant.channelConfig.deviceToken`
- `PRINTER_IP` / `PRINTER_PORT` — the printer's LAN address (port 9100)
- `PRINTER_TYPE` — `epson` (default) or `star`
- `PRINTER_CHARSET` — optional (e.g. `PC866_CYRILLIC`)

## Behaviour
- Subscribes to `GET {API_URL}/kitchen/restaurants/{id}/stream?token=...`.
- On `order:new` → prints the ticket → `POST .../ack` (only after a **successful** print).
- If the printer is unreachable, it does **not** ack — the order stays `sent` and the
  server replays it when the agent reconnects, so nothing is lost.
- Auto-reconnects with backoff. Heartbeat comments (`: ping`) are ignored.

## Run as a service (so it survives reboots)
Use pm2 (cross-platform):
```bash
npm i -g pm2
pm2 start index.js --name kitchen-print
pm2 save && pm2 startup
```
On Windows you can also use `nssm` to wrap `node index.js` as a service.

## Backend config note
When you use this agent (cloud deployment), **do not** set `channelConfig.printer.ip`
on the server — leave it empty so the cloud backend skips its own (impossible) print and
only pushes SSE. The agent holds the printer IP in its own `.env`.
Set `channelConfig.printer.ip` on the server **only** if the backend itself runs on the
restaurant's LAN (then the backend prints directly and you don't need this agent).
