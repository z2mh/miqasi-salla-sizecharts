// Get size chart for dashboard editing
import { getChart } from '../lib/storage.js';

export default async function handler(req, res) {
  try {
    console.log('🔍 GET-CHART API Called:', {
      method: req.method,
      query: req.query,
      url: req.url
    });
    
    if (req.method !== 'GET') {
      console.log('❌ Wrong method:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { store_id, product_id } = req.query;
    
    if (!store_id || !product_id) {
      console.log('❌ Missing parameters:', { store_id, product_id });
      return res.status(400).json({ 
        error: 'Missing required parameters: store_id, product_id' 
      });
    }
    
    // Get chart data using shared storage
    const chartData = getChart(store_id, product_id);
    
    if (!chartData) {
      return res.status(404).json({ 
        success: false,
        message: 'No size chart found for this product'
      });
    }
    
    res.status(200).json({
      success: true,
      data: chartData
    });
    
  } catch (error) {
    console.error('Get chart error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve size chart', 
      message: error.message 
    });
  }
}