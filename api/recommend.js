// import 'dotenv/config';
// import express from 'express';
// import assistantProxyRoutes from '../src/routes/assistantProxy.js';

// const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.get('/', (req, res) => {
//   res.status(200).json({ status: 'live', message: 'Shopify AI Proxy Serverless Endpoint' });
// });

// // Support both /api/proxy and root route rewrites
// app.use('/api/proxy', assistantProxyRoutes);
// app.use('/', assistantProxyRoutes);

// export default app;
import 'dotenv/config';
import express from 'express';
import assistantProxyRoutes from '../src/routes/assistantProxy.js';

const app = express();

// CORS must come first so preflight (OPTIONS) requests are answered with headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'live', message: 'Shopify AI Proxy Serverless Endpoint' });
});

app.use('/api/proxy', assistantProxyRoutes);
app.use('/', assistantProxyRoutes);

export default app;