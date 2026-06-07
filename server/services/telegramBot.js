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
  botInstance = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  botInstance.on('message', async (msg) => {
    await handleUpdate(msg);
  });
  return botInstance;
};

export default { handleUpdate, initPolling };
