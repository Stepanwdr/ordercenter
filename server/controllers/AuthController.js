import HttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import {
  Users,
} from '../models/index.js';
import validate from '../services/validate.js';

const { JWT_SECRET} = process.env;

class AuthController {
  static register = async (req, res, next) => {
    try {
      const {
        name,
        email, password, address, phone,role
      } = req.body;
      console.log(req.body);
      validate(req.body, {
        name: 'required|alpha|between:2,16',
        email: 'required|email',
        password: 'required|string|between:2,16',
        phone: ['required', 'string'],
      }).throw();
      const existUser = await Users.findOne({
        where: {
          $or: [
            { email },
            { phone },
          ],
        },
      });
      if (existUser) {
        const errors = {};
        if (existUser.email === email) {
          errors.email = ['Email must be unique'];
        }
        if (existUser.phone === phone) {
          errors.phone = ['Phone must be unique'];
        }
        console.log(existUser)
        throw HttpError(422, { errors });
      }
      const user = await Users.create({
        name,
        email,
        password,
        address,
        phone,
        role,
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({
        status: 'ok',
        token,
      });
    } catch (e) {
      next(e);
    }
  }

  static login = async (req, res, next) => {
    try {
      validate(req.body, {
        email: 'required|email',
        password: 'required:string|between:2,16',
      }).throw();
      const { email, password } = req.body;
      const user = await Users.findOne({
        where: { email },
      });
      if (!user || user.getDataValue('password') !== Users.passwordHash(password)) {
        throw HttpError(422, 'Such user does not exist');
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({
        status: 'ok',
        user,
        token,
      });
    } catch (e) {
      next(e);
    }
  }
}
export default AuthController;