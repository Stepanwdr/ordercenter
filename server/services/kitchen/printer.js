// Best-effort thermal ticket printing for the 'client' channel.
// Talks ESC/POS to a Posiflex PP8800 over RAW TCP:9100. Uses node-thermal-printer.
//
// Dynamic import + full try/catch so a missing/native dep or an unreachable printer
// NEVER breaks order dispatch — the SSE push is the source of truth, print is a bonus.
//
// Printer config lives in restaurant.channelConfig.printer = { ip, port?, timeout?, charset? }.

export async function printOrderTicket(payload, printerConfig) {
  const ip = printerConfig?.ip;
  if (!ip) return { ok: false, reason: 'no-printer-config' };
  const port = Number(printerConfig?.port) || 9100;

  try {
    const lib = await import('node-thermal-printer');
    const { ThermalPrinter, PrinterTypes, CharacterSet } = lib;

    // CharacterSet values are CODE PAGES (PC437_USA, PC866_CYRILLIC, ...), not 'utf-8'.
    // An unknown name resolves to undefined and makes iconv throw — only pass when valid.
    const charset = printerConfig?.charset && CharacterSet[printerConfig.charset]
      ? CharacterSet[printerConfig.charset]
      : undefined;
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // PP8800 speaks generic ESC/POS
      interface: `tcp://${ip}:${port}`,
      ...(charset ? { characterSet: charset } : {}),
      removeSpecialCharacters: false,
      options: { timeout: Number(printerConfig?.timeout) || 3000 },
    });

    const connected = await printer.isPrinterConnected();
    if (!connected) return { ok: false, reason: 'printer-unreachable' };

    buildTicket(printer, payload);
    await printer.execute(); // flush RAW bytes to TCP:9100
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'print-error', error: err?.message || String(err) };
  }
}

function buildTicket(printer, p) {
  // ---- header: order number + time ----
  printer.alignCenter();
  printer.setTextSize(1, 1);
  printer.bold(true);
  printer.println(`#${p.code}`);
  printer.bold(false);
  printer.setTextNormal();
  const when = p.createdAt ? new Date(p.createdAt).toLocaleString('ru-RU') : '';
  if (when) printer.println(when);
  if (p.orderType) printer.println(String(p.orderType).toUpperCase());
  printer.drawLine();

  // ---- customer / delivery ----
  printer.alignLeft();
  if (p.customer?.name) printer.println(`Гость: ${p.customer.name}`);
  if (p.customer?.phone) printer.println(`Тел:   ${p.customer.phone}`);
  if (p.delivery?.address) printer.println(`Адрес: ${p.delivery.address}`);
  if (p.delivery?.comment) printer.println(`Комм.: ${p.delivery.comment}`);
  printer.drawLine();

  // ---- items with quantity + modifiers ----
  for (const it of p.items || []) {
    printer.bold(true);
    printer.leftRight(`${it.quantity} x ${it.name ?? ''}`, money(it.price * it.quantity));
    printer.bold(false);
    for (const mod of it.modifiers || []) {
      printer.println(`   + ${typeof mod === 'string' ? mod : mod?.name ?? ''}`);
    }
  }
  printer.drawLine();

  // ---- totals ----
  if (Number(p.delivery?.fee) > 0) {
    printer.leftRight('Доставка:', money(p.delivery.fee));
  }
  printer.alignRight();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(`ИТОГО: ${money(p.total)}`);
  printer.setTextNormal();
  printer.bold(false);
  if (p.payment?.method) {
    printer.alignLeft();
    printer.println(`Оплата: ${p.payment.method}${p.payment.paid ? ' (оплачен)' : ''}`);
  }

  printer.newLine();
  printer.beep();  // buzzer — so the cook hears the order
  printer.cut();   // GS V full auto-cut
}

const money = (v) => Number(v ?? 0).toFixed(2);
