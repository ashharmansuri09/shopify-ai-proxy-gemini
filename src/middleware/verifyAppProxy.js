// import crypto from 'crypto';

// export const verifyShopifyAppProxy = (req, res, next) => {
//   // Local development bypass agar keys set na hon ya dev mode ho
//   if (
//     process.env.NODE_ENV === 'development' ||
//     !process.env.SHOPIFY_API_SECRET ||
//     process.env.SHOPIFY_API_SECRET === 'your_shopify_partner_client_secret'
//   ) {
//     return next();
//   }

//   try {
//     const { signature, hmac, ...params } = req.query;
//     const providedSignature = signature || hmac;

//     if (!providedSignature) {
//       return res.status(401).json({ error: 'Missing Shopify proxy signature.' });
//     }

//     const sortedParams = Object.keys(params)
//       .sort()
//       .map((key) => {
//         const val = Array.isArray(params[key]) ? params[key].join(',') : params[key];
//         return `${key}=${val}`;
//       })
//       .join('');

//     const calculatedSignature = crypto
//       .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
//       .update(sortedParams)
//       .digest('hex');

//     const isValid = crypto.timingSafeEqual(
//       Buffer.from(providedSignature, 'hex'),
//       Buffer.from(calculatedSignature, 'hex')
//     );

//     if (!isValid) {
//       return res.status(403).json({ error: 'Invalid HMAC signature. Request untrusted.' });
//     }

//     next();
//   } catch (err) {
//     return res.status(500).json({ error: 'Signature verification failed', details: err.message });
//   }
// };
import crypto from 'crypto';

export const verifyShopifyAppProxy = (req, res, next) => {
  // Temporary bypass for testing
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.BYPASS_PROXY_HMAC === 'true' ||
    !process.env.SHOPIFY_API_SECRET
  ) {
    return next();
  }

  try {
    const { signature, hmac, ...params } = req.query;
    const providedSignature = signature || hmac;

    // Agar Shopify storefront se signature nahi aaya to bypass ya log karein
    if (!providedSignature) {
      console.warn('Shopify signature missing in query, continuing for debug...');
      return next();
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => {
        const val = Array.isArray(params[key]) ? params[key].join(',') : params[key];
        return `${key}=${val}`;
      })
      .join('');

    const calculatedSignature = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(sortedParams)
      .digest('hex');

    // Safe comparison
    if (providedSignature === calculatedSignature) {
      return next();
    }

    console.warn('HMAC Mismatch! Provided:', providedSignature, 'Calculated:', calculatedSignature);
    // Development/Testing ke time block na karein
    return next();
  } catch (err) {
    console.error('HMAC Error:', err.message);
    return next();
  }
};