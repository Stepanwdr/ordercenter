import TelegramBot from 'node-telegram-bot-api';
import { Courier } from '../models/index.js';
import {Op} from "sequelize";

let botInstance = null;

export const handleUpdate = async (update) => {
  try {
    const msg = update.message || update;
    const text = (msg && msg.text) ? String(msg.text) : '';
    const match = text.match(/\/start\s*(.*)?/);
    const payload = match && match[1] ? match[1].trim() : null;
    const chatId = String(msg.chat.id);
    if (!payload) {
      if (botInstance) await botInstance.sendMessage(chatId, 'Ողջույն — ուղարկեք ուղեցույցը։');
      return { ok: false };
    }

    const courier = await Courier.findOne({
      where: {
        telegram_link_token: payload,
        telegram_link_expires_at: { [Op.gt]: new Date() },
      },
    });
    if (!courier) {
      if (botInstance) await botInstance.sendMessage(chatId, 'Invalid or expired token.');
      return { ok: false };
    }
    await courier.update({ telegramId: chatId, telegram_link_token: null, telegram_link_expires_at: null });
    if (botInstance) {
      const miniAppUrl = process.env.TELEGRAM_MINIAPP_URL || 'http://localhost:5173';
      await botInstance.sendMessage(chatId, '🔗 Ապահով կապ հաստատվեց — դուք կապված եք որպես առաքիչ', {
        reply_markup: {
          keyboard: [
            [{ text: '📋 Իմ պատվերները', web_app: { url: miniAppUrl } }]
          ],
          resize_keyboard: true,
        }
      });
    }
    return { ok: true };
  } catch (err) {
    console.error('telegram bot handler error', err?.message || err);
    return { ok: false, error: err };
  }
};

export const initPolling = () => {
  if (process.env.TELEGRAM_USE_POLLING !== 'true') return null;
  // Webhook and polling are mutually exclusive — webhook wins if both are enabled.
  if (process.env.TELEGRAM_USE_WEBHOOK === 'true') {
    console.warn('[telegram] both polling and webhook enabled — using webhook, skipping polling');
    return null;
  }
  botInstance = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  botInstance.on('message', async (msg) => {
    await handleUpdate(msg);
  });

  // node-telegram-bot-api emits the raw ETELEGRAM error on every failed getUpdates.
  // The common one is 409 (another instance is polling the same token) — log a single
  // actionable line instead of spamming the stack each poll.
  let conflictLogged = false;
  botInstance.on('polling_error', (err) => {
    const message = err?.message || String(err);
    if (err?.code === 'ETELEGRAM' && /\b409\b/.test(message)) {
      if (!conflictLogged) {
        console.error(
          '[telegram] polling conflict (409): another bot instance is polling the same token. ' +
            'Run polling on ONLY ONE instance — set TELEGRAM_USE_POLLING=true on the production server and false everywhere else.',
        );
        conflictLogged = true;
      }
      return;
    }
    conflictLogged = false;
    console.error('[telegram] polling_error:', err?.code || '', message);
  });

  return botInstance;
};

// Webhook mode: no getUpdates (so no 409 conflicts). Telegram POSTs each update to
// {TELEGRAM_WEBHOOK_URL}/telegram/webhook, which calls processWebhookUpdate().
export const initWebhook = async () => {
  if (process.env.TELEGRAM_USE_WEBHOOK !== 'true') return null;
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('[telegram] TELEGRAM_USE_WEBHOOK=true but TELEGRAM_BOT_TOKEN is missing');
    return null;
  }
  botInstance = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  botInstance.on('message', async (msg) => {
    await handleUpdate(msg);
  });

  const base = (process.env.TELEGRAM_WEBHOOK_URL || '').replace(/\/$/, '');
  if (!base) {
    console.error('[telegram] TELEGRAM_USE_WEBHOOK=true but TELEGRAM_WEBHOOK_URL is missing (e.g. https://api.deliverydepartment.am)');
    return botInstance;
  }
  const url = `${base}/telegram/webhook`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || undefined;
  try {
    await botInstance.setWebHook(url, secret ? { secret_token: secret } : {});
    console.log(`[telegram] webhook set: ${url}`);
  } catch (err) {
    console.error('[telegram] setWebHook failed:', err?.message || err);
  }
  return botInstance;
};

// Feed an incoming update (the webhook route's req.body) into the bot's event system.
export const processWebhookUpdate = (update) => {
  if (botInstance) botInstance.processUpdate(update);
};

export default { handleUpdate, initPolling, initWebhook, processWebhookUpdate };
