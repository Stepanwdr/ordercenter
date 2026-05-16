import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { handleUpdate } from '../services/telegramBot.js';

const router = express.Router();

// Telegram webhook endpoint (POST)
router.post('/webhook', asyncHandler(async (req, res) => {
  const update = req.body;
  await handleUpdate(update);
  res.json({ ok: true });
}));

export default router;
