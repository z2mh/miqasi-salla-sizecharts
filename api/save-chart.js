// Save size chart API endpoint
import { saveChart } from '../lib/storage.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { store_id, product_id, chart_data, unit } = req.body;
    
    if (!store_id || !product_id || !chart_data) {
      return res.status(400).json({ 
        error: 'Missing required fields: store_id, product_id, chart_data' 
      });
    }
    
    // Save chart data using shared storage
    const chartEntry = saveChart(store_id, product_id, chart_data, unit);
    
    res.status(200).json({
      success: true,
      message: 'Size chart saved successfully',
      chart_id: `${store_id}:${product_id}`,
      data: chartEntry
    });
    
  } catch (error) {
    console.error('Save chart error:', error);
    res.status(500).json({ 
      error: 'Failed to save size chart', 
      message: error.message 
    });
  }
}