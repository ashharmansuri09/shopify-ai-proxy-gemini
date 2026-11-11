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

// import { GoogleGenAI } from '@google/genai';

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// // Error message ke mutabiq naya model: gemini-3.8-flash
// const MODELS = [
//   process.env.GEMINI_MODEL || 'gemini-3.8-flash',
//   'gemini-flash-latest', // alias, agar primary model fail ho
// ];

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

//   let lastError;
//   for (const model of MODELS) {
//     try {
//       const response = await ai.models.generateContent({
//         model,
//         contents: promptContent,
//         config: {
//           systemInstruction,
//           responseMimeType: 'application/json',
//           temperature: 0.2,
//         },
//       });
//       return JSON.parse(response.text.trim());
//     } catch (err) {
//       lastError = err;
//       console.error(`Gemini model ${model} failed:`, err.message);
//       // Sirf "model not found" par next model try karo
//       if (!String(err.message).includes('NOT_FOUND') && !String(err.message).includes('404')) {
//         throw err;
//       }
//     }
//   }
//   throw lastError;
// };


import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS = (process.env.GEMINI_MODELS || 'gemini-3.8-flash,gemini-flash-latest')
  .split(',').map((m) => m.trim()).filter(Boolean);

const CALL_TIMEOUT_MS = 7000;
const getStatus = (err) => err?.status || err?.error?.code || err?.code || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('Gemini timeout'), { status: 504 })), ms)
    ),
  ]);

export const getAIRecommendations = async (userPrompt, availableProducts) => {
  // Sirf zaroori fields bhejo
  const slimCatalog = availableProducts.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    tags: (p.tags || []).slice(0, 5),
    desc: (p.description || '').slice(0, 80),
  }));

  const systemInstruction = `
You are an expert e-commerce shopping concierge.
Match the customer's query with the catalog. Recommend ONLY items in the catalog.
Return strictly valid JSON, no markdown:
{"assistantMessage":"short friendly Hinglish/English reply (max 2 sentences)","recommendedProductIds":["gid://shopify/Product/123"]}
Max 3-4 products.
`;

  const promptContent = `Catalog: ${JSON.stringify(slimCatalog)}\nQuery: "${userPrompt}"`;

  let lastError;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: promptContent,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.2,
              maxOutputTokens: 400,
            },
          }),
          CALL_TIMEOUT_MS
        );
        return JSON.parse(response.text.trim());
      } catch (err) {
        lastError = err;
        const status = getStatus(err);
        console.error(`Gemini ${model} attempt ${attempt} failed (${status}):`, err.message);

        if ((status === 503 || status === 429) && attempt < 2) {
          await sleep(800);
          continue;
        }
        break; // next model
      }
    }
  }
  throw lastError;
};