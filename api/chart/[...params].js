// Get size chart API endpoint with dynamic routing
// Handles requests like /api/chart/store123/product456

import { getChart } from '../../lib/storage.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Extract store_id and product_id from URL params
    const { params } = req.query;
    
    if (!params || params.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid URL format. Expected: /api/chart/{store_id}/{product_id}' 
      });
    }
    
    const [store_id, product_id] = params;
    
    // Get chart data using shared storage
    const chartData = getChart(store_id, product_id);
    
    if (!chartData) {
      return res.status(404).json({ 
        error: 'Size chart not found',
        store_id,
        product_id
      });
    }
    
    // Return chart data for widget
    res.status(200).json({
      success: true,
      store_id: chartData.store_id,
      product_id: chartData.product_id,
      sizes: chartData.sizes,
      unit: chartData.unit,
      created_at: chartData.created_at,
      updated_at: chartData.updated_at
    });
    
  } catch (error) {
    console.error('Get chart error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve size chart', 
      message: error.message 
    });
  }
}