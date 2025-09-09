import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { store_id, product_id, access_token, sizes } = req.body;

    if (!store_id || !product_id || !access_token || !sizes) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('Adding size chart as product option:', { store_id, product_id });

    // Prepare size chart data as JSON string for product option
    const sizeChartData = JSON.stringify({
      type: 'size_chart',
      sizes: sizes,
      created_at: new Date().toISOString()
    });

    // Create product option for size chart
    const productOptionData = {
      name: 'Size Chart Data', // Hidden option name
      display_type: 'hidden', // Hidden from customers
      values: [
        {
          name: 'size_chart_data',
          value: sizeChartData
        }
      ]
    };

    // Call Salla API to add product option
    const sallaBaseUrl = 'https://api.salla.dev/admin/v2';
    const response = await fetch(`${sallaBaseUrl}/products/${product_id}/options`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(productOptionData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Salla API error:', {
        status: response.status,
        body: errorText
      });
      throw new Error(`Salla API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Size chart option added successfully:', result);

    // Also store in our KV for backup/quick access
    const chartKey = `sizechart:${store_id}:${product_id}`;
    await kv.set(chartKey, {
      store_id,
      product_id,
      sizes,
      storage_method: 'product_option',
      salla_option_id: result.data?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Size chart added as product option',
      data: {
        salla_option_id: result.data?.id,
        storage_method: 'product_option'
      }
    });

  } catch (error) {
    console.error('Error adding size chart to product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add size chart to product',
      message: error.message
    });
  }
}