# Kitchen Print Agent

Small Node script that runs on the **mini-PC inside the restaurant** (same LAN as the
thermal printer). It polls the cloud API for new orders, prints each on
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
- `PRINTER_IPS` — optional, several printers: `192.168.240.23,192.168.240.30` (`ip` or
  `ip:port`). The **same full ticket** prints on **all** of them (e.g. kitchen + bar).
  If set, overrides `PRINTER_IP`.
- `PRINTER_TYPE` — `epson` (default) or `star`
- `PRINTER_CHARSET` — optional (e.g. `PC866_CYRILLIC2`)

## Behaviour
- **Polls** `GET {API_URL}/kitchen/restaurants/{id}/pending?token=...` every
  `POLL_INTERVAL_MS` (default 4000ms) and prints anything not yet acked.
- On a new order → prints the **same** ticket to **every** configured printer (in
  parallel) → `POST .../ack` (only after **all** printers succeed).
- If a printer is unreachable, it does **not** ack — the order stays pending and is
  retried on the next poll. Printers that already printed are skipped, so a dead bar
  printer never reprints the kitchen ticket.
- A dropped/refused request just retries next tick — no long-lived connection to break.

> **Why polling, not SSE?** Shared hosting (LiteSpeed/Passenger on cPanel) cuts long-lived
> streaming connections (`UND_ERR_SOCKET`), which made the SSE stream unreliable. Short
> polls pass through any proxy untouched.

## ⚠️ Windows: turn OFF QuickEdit Mode
If you run the agent in a console window, Windows **QuickEdit Mode** will **freeze the
process** the moment you click inside the window (or select text) — orders stop printing
until someone presses **Enter**. Symptom: *"it only prints when I press Enter in the
terminal."*

Fix (do this on the printer PC):
1. Click the terminal's title-bar icon → **Properties**.
2. **Options** tab → uncheck **QuickEdit Mode** → OK.

Better: run it as a **service** (below) — a service has no interactive console, so it can
never be frozen, and it starts automatically when the PC boots.

## Run as a service (autostart on boot + can't be frozen)
**Windows (recommended) — NSSM:**
```bat
:: download nssm.exe (https://nssm.cc), then from an Admin terminal:
nssm install KitchenPrintAgent "C:\Program Files\nodejs\node.exe" "D:\print-agent\index.js"
nssm set KitchenPrintAgent AppDirectory "D:\print-agent"
nssm set KitchenPrintAgent AppStdout "D:\print-agent\agent.log"
nssm set KitchenPrintAgent AppStderr "D:\print-agent\agent.log"
nssm start KitchenPrintAgent
```
The service runs headless (no QuickEdit), restarts on crash, and starts on boot. Logs go
to `agent.log`.

**Cross-platform — pm2:**
```bash
npm i -g pm2
pm2 start index.js --name kitchen-print
pm2 save && pm2 startup
```

## Backend config note
When you use this agent (cloud deployment), **do not** set `channelConfig.printer.ip`
on the server — leave it empty so the cloud backend skips its own (impossible) print and
only pushes SSE. The agent holds the printer IP in its own `.env`.
Set `channelConfig.printer.ip` on the server **only** if the backend itself runs on the
restaurant's LAN (then the backend prints directly and you don't need this agent).
