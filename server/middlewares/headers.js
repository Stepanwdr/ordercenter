const ALLOW_ORIGINS = [
  'http://localhost:3000',
  '127.0.0.1:8081',
  'http://localhost:5173',
];

export default function headers(req, res, next) {
  try {
    const { method } = req;
    const { origin } = req.headers;
    // if (method === 'OPTIONS') {
    //   next();
    //   return;
    // }

    if (ALLOW_ORIGINS.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Methods', 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE');
      res.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    }

    next();
  } catch (e) {
    next(e);
  }
}