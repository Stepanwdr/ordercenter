import authenticate from './authenticate.js';

const PUBLIC_ROUTES = new Set([
  'POST:api/auth/register',
  'POST:api/auth/login',
  'POST:api/auth/refresh',
  'GET:api/',
]);

export default function authorization(req, res, next) {
  const routeKey = `${req.method.toUpperCase()}:${req.path}`;
  console.log({routeKey})
  if (PUBLIC_ROUTES.has(routeKey)) {
    next();
    return;
  }

  authenticate(req, res, next);
}
