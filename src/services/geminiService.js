// import { GoogleGenAI } from '@google/genai';

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// export const getAIRecommendations = async (userPrompt, availableProducts) => {
//   const systemInstruction = `
// You are an expert e-commerce shopping concierge.
// Your job is to match a customer's query with the store's available product inventory.
// Rules:
// 1. Recommend ONLY items present in the provided catalog.
// 2. Return strictly valid JSON with no markdown wrapping, matching this schema:
// {
//   "assistantMessage": "Friendly, empathetic, conversational response in Hinglish/English explaining why these were picked",
//   "recommendedProductIds": ["gid://shopify/Product/123456789"]
// }
// Limit recommendations to top 3-4 matches.
// `;

//   const promptContent = `Catalog: ${JSON.stringify(availableProducts)}\n\nCustomer Query: "${userPrompt}"`;

//   const response = await ai.models.generateContent({
//     model: 'gemini-2.5-flash',
//     contents: promptContent,
//     config: {
//       systemInstruction: systemInstruction,
//       responseMimeType: 'application/json',
//       temperature: 0.2,
//     },
//   });

//   return JSON.parse(response.text.trim());
// };

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Error message ke mutabiq naya model: gemini-3.8-flash
const MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-flash-latest', // alias, agar primary model fail ho
];

export const getAIRecommendations = async (userPrompt, availableProducts) => {
  const systemInstruction = `
You are an expert e-commerce shopping concierge.
Your job is to match a customer's query with the store's available product inventory.
Rules:
1. Recommend ONLY items present in the provided catalog.
2. Return strictly valid JSON with no markdown wrapping, matching this schema:
{
  "assistantMessage": "Friendly, empathetic, conversational response in Hinglish/English explaining why these were picked",
  "recommendedProductIds": ["gid://shopify/Product/123456789"]
}
Limit recommendations to top 3-4 matches.
`;

  const promptContent = `Catalog: ${JSON.stringify(availableProducts)}\n\nCustomer Query: "${userPrompt}"`;

  let lastError;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: promptContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      return JSON.parse(response.text.trim());
    } catch (err) {
      lastError = err;
      console.error(`Gemini model ${model} failed:`, err.message);
      // Sirf "model not found" par next model try karo
      if (!String(err.message).includes('NOT_FOUND') && !String(err.message).includes('404')) {
        throw err;
      }
    }
  }
  throw lastError;
};
