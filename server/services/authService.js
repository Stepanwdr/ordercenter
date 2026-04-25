import { Op } from 'sequelize';
import { RefreshToken, User, Courier, sequelize } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateRefreshToken, getRefreshTokenExpiryDate, signAccessToken } from '../utils/tokens.js';

const buildAuthResponse = async (user, transaction) => {
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiryDate();

  await RefreshToken.create(
    {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
    { transaction }
  );

  return {
    user,
    accessToken: signAccessToken({ userId: user.id, role: user.role }),
    refreshToken,
  };
};

class AuthService {
  static async register(payload) {
    return sequelize.transaction(async (transaction) => {
      const existingUser = await User.unscoped().findOne({
        where: { email: payload.email.toLowerCase() },
        transaction,
      });

      if (existingUser) {
        throw new AppError(409, 'Email is already registered');
      }

      const hashedPassword = await hashPassword(payload.password);
      const user = await User.unscoped().create(
        {
          email: payload.email.toLowerCase(),
          password: hashedPassword,
          role: payload.role,
        },
        { transaction }
      );

      if (user.role === 'courier') {
        await Courier.create(
          {
            userId: user.id,
            status: 'offline',
          },
          { transaction }
        );
      }

      const cleanUser = await User.findByPk(user.id, { transaction });
      return buildAuthResponse(cleanUser, transaction);
    });
  }

  static async login(payload) {
    return sequelize.transaction(async (transaction) => {
      const user = await User.scope('withPassword').findOne({
        where: { email: payload.email.toLowerCase() },
        transaction,
      });

      if (!user) {
        throw new AppError(401, 'Invalid email or password');
      }

      const isPasswordValid = await comparePassword(payload.password, user.password);
      if (!isPasswordValid) {
        throw new AppError(401, 'Invalid email or password');
      }

      const cleanUser = await User.findByPk(user.id, { transaction });
      return buildAuthResponse(cleanUser, transaction);
    });
  }

  static async refresh(refreshTokenValue) {
    return sequelize.transaction(async (transaction) => {
      const refreshToken = await RefreshToken.findOne({
        where: {
          token: refreshTokenValue,
          expiresAt: {
            [Op.gt]: new Date(),
          },
        },
        transaction,
      });

      if (!refreshToken) {
        throw new AppError(401, 'Refresh token is invalid or expired');
      }

      const user = await User.findByPk(refreshToken.userId, { transaction });
      if (!user) {
        throw new AppError(401, 'User not found for refresh token');
      }

      await refreshToken.destroy({ transaction });
      return buildAuthResponse(user, transaction);
    });
  }
}

export default AuthService;
