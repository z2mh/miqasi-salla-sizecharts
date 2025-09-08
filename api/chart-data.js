// Combined endpoint to handle both save and get chart operations
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    console.log('📊 CHART-DATA API Called:', {
      method: req.method,
      query: req.query,
      body: req.body,
      url: req.url
    });

    // Handle GET request - retrieve chart
    if (req.method === 'GET') {
      const { store_id, product_id } = req.query;
      
      if (!store_id || !product_id) {
        console.log('❌ GET: Missing parameters:', { store_id, product_id });
        return res.status(400).json({ 
          error: 'Missing required parameters: store_id, product_id' 
        });
      }

      const chartKey = `sizechart:${store_id}:${product_id}`;
      const chartData = await kv.get(chartKey);
      
      if (!chartData) {
        console.log(`❌ No chart found for ${store_id}:${product_id}`);
        return res.status(404).json({ 
          success: false,
          message: 'No size chart found for this product'
        });
      }

      console.log(`✅ Chart found in KV for ${store_id}:${product_id}`);
      return res.status(200).json({
        success: true,
        data: typeof chartData === 'string' ? JSON.parse(chartData) : chartData
      });
    }

    // Handle POST request - save chart
    if (req.method === 'POST') {
      const { store_id, product_id, chart_data, unit } = req.body;
      
      if (!store_id || !product_id || !chart_data) {
        console.log('❌ POST: Missing parameters:', { store_id, product_id, chart_data });
        return res.status(400).json({ 
          error: 'Missing required fields: store_id, product_id, chart_data' 
        });
      }

      const chartKey = `sizechart:${store_id}:${product_id}`;
      const storeKey = `sizechart:store:${store_id}`;
      
      const chartEntry = {
        store_id,
        product_id,
        sizes: chart_data,
        unit: unit || 'cm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save chart to KV
      await kv.set(chartKey, JSON.stringify(chartEntry));
      
      // Add to store's product list
      await kv.sadd(storeKey, product_id);
      
      console.log(`✅ Chart saved to KV for ${store_id}:${product_id}`);
      return res.status(200).json({
        success: true,
        message: 'Size chart saved successfully',
        chart_id: `${store_id}:${product_id}`,
        data: chartEntry
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Chart-data error:', error);
    res.status(500).json({ 
      error: 'Failed to process chart data', 
      message: error.message 
    });
  }
}