// Simple global storage for demo purposes
// In production, use a database like MongoDB or PostgreSQL

// Use global object to persist data across function calls in the same instance
if (!globalThis.sizeChartsData) {
  globalThis.sizeChartsData = {};
  console.log('🆕 Initialized global storage');
} else {
  console.log(`📁 Using existing global storage with ${Object.keys(globalThis.sizeChartsData).length} charts`);
}

const sizeChartsData = globalThis.sizeChartsData;

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
  
  sizeChartsData[chartKey] = chartEntry;
  globalThis.sizeChartsData = sizeChartsData;
  console.log(`📊 Saved size chart for ${chartKey}:`, Object.keys(chartData));
  console.log(`📈 Total charts in storage: ${Object.keys(sizeChartsData).length}`);
  return chartEntry;
}

export function getChart(storeId, productId) {
  const chartKey = `${storeId}:${productId}`;
  const chart = sizeChartsData[chartKey];
  
  if (chart) {
    console.log(`📖 Retrieved size chart for ${chartKey}:`, Object.keys(chart.sizes));
  } else {
    console.log(`❌ No size chart found for ${chartKey}`);
  }
  
  return chart;
}

export function getAllCharts(storeId) {
  const storeCharts = [];
  
  for (const [key, chart] of Object.entries(sizeChartsData)) {
    if (chart.store_id === storeId) {
      storeCharts.push(chart);
    }
  }
  
  console.log(`📚 Found ${storeCharts.length} charts for store ${storeId}`);
  return storeCharts;
}

export function deleteChart(storeId, productId) {
  const chartKey = `${storeId}:${productId}`;
  const existed = sizeChartsData[chartKey] !== undefined;
  
  if (existed) {
    delete sizeChartsData[chartKey];
    globalThis.sizeChartsData = sizeChartsData;
    console.log(`🗑️ Deleted size chart for ${chartKey}`);
  }
  
  return existed;
}