import jwt from 'jsonwebtoken';
import HttpError from 'http-errors';
import * as url from 'url';

const { JWT_SECRET } = process.env;

const EXCLUDE = [
  'POST:/auth/login',
  'POST:/auth/register',
  'GET:/users/account',
];

export default function (req, res, next) {
  try {
    const { originalUrl, method } = req;
    // if (method === 'OPTIONS') {
    //   next();
    //   return;
    // }
    const { pathname } = url.parse(req.url);
    console.log({pathname,method})
    const exclude = EXCLUDE.some((exc) => {
      if (exc.includes('*')) {
        return `${method}:${pathname}`.startsWith(exc.replace('*', ''));
      }
      return exc === `${method}:${pathname}`;
    });
    if (exclude) {
      next();
      return;
    }
    const { authorization = '' } = req.headers;
    const token = authorization.replace(/^Bearer /, '');
    let userId;
    try {
      const data = jwt.verify(token, JWT_SECRET);
      userId = data.userId;
    } catch (e) {
      //
    }
    if (!userId) {
      throw HttpError(401);
    }
    console.log({userId},'withAuth')
    req.userId = userId;
    next();
  } catch (e) {
    next(e);
  }
}