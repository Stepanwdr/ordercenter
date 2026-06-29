import authenticate from './authenticate.js';

const PUBLIC_ROUTES = new Set([
  'POST:/auth/register',
  'POST:/auth/login',
  'POST:/auth/refresh',
  'GET:/',
  // Needed so the public registration page can list restaurants when creating a courier.
  'GET:/*/restaurants',
]);

export default function authorization(req, res, next) {
  const routeKey = `${req.method.toUpperCase()}:${req.path}`;

  if (PUBLIC_ROUTES.has(routeKey)) {
    console.log('PUBLIC_ROUTES:', routeKey);
    next();
    return;
  }
  console.log('axxed:', routeKey);
  authenticate(req, res, next);
}
