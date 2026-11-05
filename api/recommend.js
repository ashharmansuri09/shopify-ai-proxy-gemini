import 'dotenv/config';
import express from 'express';
import assistantProxyRoutes from '../src/routes/assistantProxy.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'live', message: 'Shopify AI Proxy Serverless Endpoint' });
});

// Support both /api/proxy and root route rewrites
app.use('/api/proxy', assistantProxyRoutes);
app.use('/', assistantProxyRoutes);

export default app;
