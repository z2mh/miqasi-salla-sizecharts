export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { store_id, product_id, access_token } = req.query;

    if (!store_id || !product_id) {
      return res.status(400).json({ error: 'Missing store_id or product_id' });
    }

    console.log('Getting size chart from product options:', { store_id, product_id });

    // If access_token provided, fetch from Salla API
    if (access_token) {
      try {
        const sallaBaseUrl = 'https://api.salla.dev/admin/v2';
        const response = await fetch(`${sallaBaseUrl}/products/${product_id}`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const productData = await response.json();
          const product = productData.data;

          // Look for size chart option
          if (product.options && product.options.length > 0) {
            for (const option of product.options) {
              if (option.name === 'Size Chart Data' && option.values && option.values.length > 0) {
                try {
                  const sizeChartData = JSON.parse(option.values[0].value);
                  if (sizeChartData.type === 'size_chart') {
                    console.log('Size chart found in product options');
                    return res.status(200).json({
                      success: true,
                      data: {
                        store_id,
                        product_id,
                        sizes: sizeChartData.sizes,
                        storage_method: 'product_option',
                        created_at: sizeChartData.created_at
                      }
                    });
                  }
                } catch (parseError) {
                  console.error('Error parsing size chart data:', parseError);
                }
              }
            }
          }
        }
      } catch (sallaError) {
        console.error('Error fetching from Salla API:', sallaError);
      }
    }

    // Fallback to KV storage
    const { kv } = await import('@vercel/kv');
    const chartKey = `sizechart:${store_id}:${product_id}`;
    const chartData = await kv.get(chartKey);

    if (chartData) {
      console.log('Size chart found in KV storage');
      return res.status(200).json({
        success: true,
        data: chartData
      });
    }

    console.log('No size chart found');
    res.status(200).json({
      success: false,
      message: 'No size chart found for this product'
    });

  } catch (error) {
    console.error('Error getting product size chart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get size chart',
      message: error.message
    });
  }
}