import authenticate from './authenticate.js';

const PUBLIC_ROUTES = new Set([
  'POST:/auth/register',
  'POST:/auth/login',
  'POST:/auth/refresh',
  'GET:/',
]);

export default function authorization(req, res, next) {
  const routeKey = `${req.method.toUpperCase()}:${req.path}`;

  if (PUBLIC_ROUTES.has(routeKey)) {
    next();
    return;
  }

  authenticate(req, res, next);
}
