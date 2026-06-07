import fetch from 'node-fetch';
import AppError from '../utils/AppError.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

if (!API_BASE) {
  // We won't throw at import time; services should handle missing token gracefully
}

const sendMessage = async (chatId, text, options = {}) => {
  if (!API_BASE) throw new AppError(500, 'Telegram bot not configured');
  const url = `${API_BASE}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  });
  const data = await res.json();
  if (!data || !data.ok) {
    throw new AppError(500, `Telegram sendMessage failed: ${JSON.stringify(data)}`);
  }
  return data.result;
};

export default { sendMessage };
