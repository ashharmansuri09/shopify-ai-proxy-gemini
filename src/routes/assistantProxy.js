import express from 'express';
import { verifyShopifyAppProxy } from '../middleware/verifyAppProxy.js';
import { fetchActiveProducts } from '../services/shopifyAdmin.js';
import { getAIRecommendations } from '../services/geminiService.js';

const router = express.Router();

const extractBudgetLimit = (text) => {
  if (!text) return null;
  const match =
    text.match(/(?:under|below|andar|less than|upto|₹|rs\.?)\s*(\d+)/i) ||
    text.match(/(\d+)\s*(?:ke andar|se kam|inr|rs)/i);
  return match ? parseInt(match[1], 10) : null;
};

// GET routes for health & browser tests
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

// Explicit OPTIONS preflight for direct fetch testing
router.options('/recommend', (req, res) => {
  res.status(200).end();
});

// Core POST recommendation logic
router.post('/recommend', verifyShopifyAppProxy, async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid prompt is required in request body.' 
      });
    }

    const budgetLimit = extractBudgetLimit(prompt);

    // 1. Fetch products from Shopify GraphQL
    let catalog = [];
    try {
      catalog = await fetchActiveProducts(budgetLimit);
    } catch (shopifyErr) {
      console.error('Shopify Admin Fetch Error:', shopifyErr);
      return res.status(500).json({
        success: false,
        message: 'Shopify catalog fetch failed.',
        details: shopifyErr.message
      });
    }

    if (!catalog || !catalog.length) {
      return res.json({
        success: true,
        message: 'Aapke budget ya requirement ke hisab se filhal stock available nahi hai.',
        products: [],
      });
    }

    // 2. Run Gemini Recommendation
    let aiResult;
    try {
      aiResult = await getAIRecommendations(prompt.trim(), catalog);
    } catch (geminiErr) {
      console.error('Gemini Service Error:', geminiErr);
      return res.status(500).json({
        success: false,
        message: 'Gemini AI service failed.',
        details: geminiErr.message
      });
    }

    // 3. Match Products
    const recommendedIds = aiResult?.recommendedProductIds || [];
    const matchedProducts = catalog.filter((item) =>
      recommendedIds.includes(item.id)
    );

    return res.json({
      success: true,
      message: aiResult?.assistantMessage || 'Here are some recommendations for you:',
      products: matchedProducts.length > 0 ? matchedProducts : catalog.slice(0, 3),
    });

  } catch (error) {
    console.error('Proxy Unexpected Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Service error',
      details: error.message,
    });
  }
});

export default router;