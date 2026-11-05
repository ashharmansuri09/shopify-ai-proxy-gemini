export const fetchActiveProducts = async (maxPrice = null) => {
  const queryFilter = maxPrice ? `status:ACTIVE variants.price:<=${maxPrice}` : 'status:ACTIVE';

  const graphqlQuery = {
    query: `
      query getProducts($query: String!) {
        products(first: 30, query: $query) {
          edges {
            node {
              id
              title
              handle
              description
              tags
              totalInventory
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              featuredImage {
                url
                altText
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    availableForSale
                    price
                  }
                }
              }
            }
          }
        }
      }
    `,
    variables: { query: queryFilter },
  };

  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: JSON.stringify(graphqlQuery),
    }
  );

  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));

  return json.data.products.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description ? node.description.slice(0, 200) : '',
    tags: node.tags || [],
    price: parseFloat(node.priceRangeV2.minVariantPrice.amount),
    currency: node.priceRangeV2.minVariantPrice.currencyCode,
    imageUrl: node.featuredImage?.url || null,
    variantId: node.variants.edges[0]?.node?.id || null,
    available: node.variants.edges[0]?.node?.availableForSale || false,
  }));
};
