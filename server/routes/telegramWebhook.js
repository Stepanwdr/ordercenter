import express from 'express';
import { processWebhookUpdate } from '../services/telegramBot.js';

const router = express.Router();

// Telegram POSTs each update here (configured via setWebHook in initWebhook). If a secret
// token was set, Telegram echoes it in this header — verify it so only Telegram can post.
// Always respond 200 quickly; processing happens via the bot's event handlers.
router.post('/webhook', (req, res) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.get('X-Telegram-Bot-Api-Secret-Token') !== secret) {
    res.sendStatus(403);
    return;
  }
  try {
    processWebhookUpdate(req.body);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[telegram] webhook process error', err?.message || err);
  }
  res.sendStatus(200);
});

export default router;
