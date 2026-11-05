import express from 'express';
import { verifyShopifyAppProxy } from '../middleware/verifyAppProxy.js';
import { fetchActiveProducts } from '../services/shopifyAdmin.js';
// ✅ Isko geminiService karein
import { getAIRecommendations } from '../services/geminiService.js';

const router = express.Router();

const extractBudgetLimit = (text) => {
  const match =
    text.match(/(?:under|below|andar|less than|upto|₹|rs\.?)\s*(\d+)/i) ||
    text.match(/(\d+)\s*(?:ke andar|se kam|inr|rs)/i);
  return match ? parseInt(match[1], 10) : null;
};

// GET routes to avoid "Cannot GET" errors in browser
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shopify App Proxy endpoint active hai.',
    endpoint: 'POST /api/proxy/recommend',
  });
});

router.get('/recommend', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ye endpoint sirf POST request accept karta hai.',
    payloadFormat: { prompt: '5000 ke andar gift for mom' },
  });
});

// Core POST recommendation logic
router.post('/recommend', verifyShopifyAppProxy, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Valid prompt is required.' });
    }

    const budgetLimit = extractBudgetLimit(prompt);
    const catalog = await fetchActiveProducts(budgetLimit);

    if (!catalog || !catalog.length) {
      return res.json({
        success: true,
        message: 'Aapke budget ya requirement ke hisab se filhal stock available nahi hai.',
        products: [],
      });
    }

    const aiResult = await getAIRecommendations(prompt.trim(), catalog);
    const matchedProducts = catalog.filter((item) =>
      aiResult.recommendedProductIds?.includes(item.id)
    );

    return res.json({
      success: true,
      message: aiResult.assistantMessage,
      products: matchedProducts,
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Service unavailable. Please try again in a moment.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
