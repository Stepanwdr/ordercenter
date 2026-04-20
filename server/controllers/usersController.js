import {
  Users,
} from '../models/index.js';
import jwt from "jsonwebtoken";
const { JWT_SECRET  } = process.env;

class UsersController {
  static myAccount = async (req, res, next) => {
    try {
      const { authorization } = req.headers;
      const token = authorization.replace(/^Bearer /, '');
      const data = await jwt.verify(token, JWT_SECRET);
      const user = await Users.findByPk(data.userId);

      if (user && user.status !== 'active') {
        res.status(403).json({
          errors: {
            status: 'You are deactivated',
          },
        });
        return;
      }
      res.json({
        status: 'ok',
        data: {...user.toJSON()},
        loginService: req.loginService,
      });
    } catch (e) {
      next(e);
    }
  };
}
export default UsersController;