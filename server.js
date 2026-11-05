// import 'dotenv/config';
// import express from 'express';
// import assistantProxyRoutes from './src/routes/assistantProxy.js';

// const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Root route for Shopify Admin app embed / health check
// app.get('/', (req, res) => {
//   res.status(200).send(`
//     <!DOCTYPE html>
//     <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>AI Shopping Assistant Proxy</title>
//         <style>
//           body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f6f6f7; display: flex; justify-content: center; }
//           .card { background: #ffffff; max-width: 480px; width: 100%; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); text-align: center; }
//           .badge { display: inline-block; padding: 4px 12px; background: #e3f1df; color: #108043; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 16px; }
//           h2 { margin: 0 0 12px; color: #202223; }
//           p { color: #6d7175; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
//           code { background: #f1f2f3; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
//         </style>
//       </head>
//       <body>
//         <div class="card">
//           <span class="badge">&#9679; Server Active</span>
//           <h2>AI Shopping Assistant Proxy</h2>
//           <p>Proxy backend chal raha hai. Storefront requests <code>/apps/ai-assistant</code> ke zariye route hongi.</p>
//         </div>
//       </body>
//     </html>
//   `);
// });

// // Mount proxy routes
// app.use('/api/proxy', assistantProxyRoutes);

// // Health check endpoint
// app.get('/health', (req, res) => res.status(200).send('OK'));

// const PORT = process.env.PORT || 3000;
// if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
//   app.listen(PORT, () => {
//     console.log(`AI Shopping Assistant Proxy Server running on port ${PORT}`);
//   });
// }

// export default app;
import express from 'express';
import dotenv from 'dotenv';
import assistantProxyRoutes from './src/routes/assistantProxy.js';

dotenv.config();

const app = express();

// 1. Universal CORS (Taki Direct Vercel test aur Storefront dono smoothly chalein)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 2. Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health & Proxy Routes
app.get('/', (req, res) => {
  res.json({ status: 'active', timestamp: new Date().toISOString() });
});

app.use('/api/proxy', assistantProxyRoutes);

// 4. Fallback Error Handler (Crash hone par HTML ke bajaye readable JSON dega)
app.use((err, req, res, next) => {
  console.error('SERVER CRASH LOG:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;