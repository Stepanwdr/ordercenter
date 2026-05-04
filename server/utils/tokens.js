import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const {
  JWT_SECRET = 'change-mesd',
  ACCESS_TOKEN_TTL = '300m',
  REFRESH_TOKEN_TTL_DAYS = '150',
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
