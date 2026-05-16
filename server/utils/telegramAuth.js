import crypto from 'crypto';

export function verifyTelegramInitData(initData, botToken) {
  const decoded = new URLSearchParams(initData);
  const hash = decoded.get('hash');
  if (!hash) return null;

  const authDate = decoded.get('auth_date');

  const dataCheckString = Array.from(decoded.entries())
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${val}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  const authDateSec = parseInt(authDate, 10);
  if (Date.now() / 1000 - authDateSec > 86400) return null;

  try {
    const user = JSON.parse(decoded.get('user'));
    return user;
  } catch {
    return null;
  }
}
