// Combined endpoint to handle both save and get chart operations
import { getChart, saveChart } from '../lib/storage.js';

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

      const chartData = getChart(store_id, product_id);
      
      if (!chartData) {
        console.log(`❌ No chart found for ${store_id}:${product_id}`);
        return res.status(404).json({ 
          success: false,
          message: 'No size chart found for this product'
        });
      }

      console.log(`✅ Chart found for ${store_id}:${product_id}`);
      return res.status(200).json({
        success: true,
        data: chartData
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

      const chartEntry = saveChart(store_id, product_id, chart_data, unit);
      
      console.log(`✅ Chart saved for ${store_id}:${product_id}`);
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