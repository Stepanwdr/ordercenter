# WireGuard setup — cloud backend → restaurant printer

Goal: the **cloud** backend reaches the **printer** inside a restaurant over a WireGuard
tunnel, then prints directly (no agent, no port-forwarding on the restaurant router).

```
[Cloud backend + WG server 10.8.0.1]  ──WG──▶  [Restaurant PC 10.8.0.2]  ──LAN──▶  [Printer 192.168.1.50]
                                                   (runs tcp-forward.js :9100)
```

The restaurant PC connects OUT to the cloud (UDP), so NAT is not a problem. The backend
prints to the PC's WG IP `10.8.0.2:9100`, the forwarder relays it to the printer.

---

## 0. Prereqs
- Cloud host with a **public IP** and **UDP 51820** open (firewall / security group).
- WireGuard on the cloud (Linux): `apt install wireguard` (or `yum`).
- WireGuard on the restaurant PC: the **WireGuard** app from wireguard.com (Windows/Mac) or `apt install wireguard` (Linux).
- Node on the restaurant PC (for `tcp-forward.js`).

## 1. Generate keys (one keypair per machine)
On any machine with WireGuard (`wg`) installed:

```bash
# server (cloud)
wg genkey | tee server.key | wg pubkey > server.pub
# client (restaurant "Pandok")
wg genkey | tee pandok.key | wg pubkey > pandok.pub
```

You now have 4 strings. Fill them in:

| Placeholder | Value |
|---|---|
| `<SERVER_PRIVATE_KEY>` (server.conf) | contents of `server.key` |
| `<SERVER_PUBLIC_KEY>` (restaurant-*.conf) | contents of `server.pub` |
| `<PANDOK_CLIENT_PRIVATE_KEY>` (restaurant-pandok.conf) | contents of `pandok.key` |
| `<PANDOK_CLIENT_PUBLIC_KEY>` (server.conf) | contents of `pandok.pub` |
| `<CLOUD_PUBLIC_IP>` (restaurant-*.conf) | your cloud server's public IP |

> Private keys never leave their own machine. Only public keys are shared.

## 2. Cloud server
```bash
sudo cp server.conf /etc/wireguard/wg0.conf   # after filling placeholders
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0             # start on boot
sudo wg                                         # verify interface is up
```

## 3. Restaurant PC (the one with the printer)
1. Open the **WireGuard** app → **Add Tunnel** → import `restaurant-pandok.conf` (filled) → **Activate**.
   - Linux: `sudo cp restaurant-pandok.conf /etc/wireguard/wg0.conf && sudo wg-quick up wg0`
2. Start the printer forwarder (keep it running):
   ```bash
   # set your real printer IP
   PRINTER_IP=192.168.1.50 node tcp-forward.js
   ```
   - Windows alternative (no Node): run as admin
     `netsh interface portproxy add v4tov4 listenport=9100 listenaddress=10.8.0.2 connectaddress=192.168.1.50 connectport=9100`
3. Make both survive reboots:
   - WireGuard app: tunnel option **"Activate on boot"** (or `wg-quick` systemd on Linux).
   - Forwarder: wrap with **pm2** (`npm i -g pm2 && pm2 start tcp-forward.js && pm2 save && pm2 startup`) or **nssm** on Windows.

## 4. Verify the tunnel
From the **cloud** server:
```bash
ping 10.8.0.2                 # the restaurant PC over WG
nc -vz 10.8.0.2 9100          # the printer via the forwarder  (Connected = good)
```

## 5. Point the app at the printer
In the CRM → restaurant → Edit, set:
- **Канал доставки** = `client`
- **Принтер · IP** = `10.8.0.2` (the PC's WG IP)
- **Порт** = `9100`
- **Таймаут** = `8000` (cloud↔VPN is slower than LAN)
- **Обязательная печать** = ✅ (so a transient outage retries via the kitchen retry worker)

(Or `PUT /restaurants/:id` with `channelConfig.printer = { ip:"10.8.0.2", port:9100, timeout:8000, required:true }`.)

Now creating an order prints on the restaurant printer through the tunnel.

---

## Adding more restaurants
1. Generate a new client keypair.
2. Copy `restaurant-pandok.conf` → `restaurant-<name>.conf`, set a unique `Address` (`10.8.0.3/24`, `.4`, …) and the new private key.
3. Add a `[Peer]` block to `server.conf` with the new client's **public** key and matching `AllowedIPs = 10.8.0.3/32`, then `wg-quick down wg0 && wg-quick up wg0` on the cloud (or `wg set wg0 peer ...`).
4. Import the new client conf on that restaurant's PC; run a forwarder there; set its `channelConfig.printer.ip = 10.8.0.3`.

## Notes
- Each restaurant PC gets a **unique WG IP** → no LAN-subnet collisions, even if every
  restaurant uses `192.168.1.x`.
- If the Node backend runs on a **different** host than the WG server, that host also
  needs a route to `10.8.0.0/24` (run WG there too, or add a static route + IP forwarding
  on the WG server). Simplest: run WG on the same host as the backend.
- Security: keep UDP 51820 the only thing exposed; WG drops everything unauthenticated.
