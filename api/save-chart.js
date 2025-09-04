// Save size chart API endpoint
// In-memory storage for demo purposes
const sizeCharts = new Map();

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
    
    // Create unique key for the chart
    const chartKey = `${store_id}:${product_id}`;
    
    // Save chart data
    const chartEntry = {
      store_id,
      product_id,
      sizes: chart_data,
      unit: unit || 'cm',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    sizeCharts.set(chartKey, chartEntry);
    
    console.log(`Saved size chart for store ${store_id}, product ${product_id}:`, chartEntry);
    
    res.status(200).json({
      success: true,
      message: 'Size chart saved successfully',
      chart_id: chartKey,
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