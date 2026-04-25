import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const {
  JWT_SECRET = 'change-me',
  ACCESS_TOKEN_TTL = '15m',
  REFRESH_TOKEN_TTL_DAYS = '30',
} = process.env;

export const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

export const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);

export const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

export const getRefreshTokenExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(REFRESH_TOKEN_TTL_DAYS));
  return expiresAt;
};
