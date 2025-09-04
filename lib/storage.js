// Simple global storage for demo purposes
// In production, use a database like MongoDB or PostgreSQL

// Use global object to persist data across function calls
if (!global.sizeChartsStorage) {
  global.sizeChartsStorage = new Map();
}

export const sizeCharts = global.sizeChartsStorage;

// Helper functions for chart operations
export function saveChart(storeId, productId, chartData, unit = 'cm') {
  const chartKey = `${storeId}:${productId}`;
  const chartEntry = {
    store_id: storeId,
    product_id: productId,
    sizes: chartData,
    unit,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  sizeCharts.set(chartKey, chartEntry);
  console.log(`📊 Saved size chart for ${chartKey}:`, Object.keys(chartData));
  return chartEntry;
}

export function getChart(storeId, productId) {
  const chartKey = `${storeId}:${productId}`;
  const chart = sizeCharts.get(chartKey);
  
  if (chart) {
    console.log(`📖 Retrieved size chart for ${chartKey}:`, Object.keys(chart.sizes));
  } else {
    console.log(`❌ No size chart found for ${chartKey}`);
  }
  
  return chart;
}

export function getAllCharts(storeId) {
  const storeCharts = [];
  
  for (const [key, chart] of sizeCharts.entries()) {
    if (chart.store_id === storeId) {
      storeCharts.push(chart);
    }
  }
  
  console.log(`📚 Found ${storeCharts.length} charts for store ${storeId}`);
  return storeCharts;
}

export function deleteChart(storeId, productId) {
  const chartKey = `${storeId}:${productId}`;
  const deleted = sizeCharts.delete(chartKey);
  
  if (deleted) {
    console.log(`🗑️ Deleted size chart for ${chartKey}`);
  }
  
  return deleted;
}