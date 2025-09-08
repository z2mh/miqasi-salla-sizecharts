// Persistent file-based storage for size charts
import fs from 'fs';
import path from 'path';

// Define the storage file path
const STORAGE_DIR = path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'size-charts.json');

// Ensure data directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  console.log('📁 Created data directory');
}

// Load existing data or initialize empty storage
let sizeChartsData = {};

function loadData() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
      sizeChartsData = JSON.parse(fileContent);
      console.log(`📁 Loaded ${Object.keys(sizeChartsData).length} charts from persistent storage`);
    } else {
      console.log('🆕 Initialized new persistent storage');
      saveData(); // Create the file
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
    sizeChartsData = {};
  }
}

function saveData() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(sizeChartsData, null, 2), 'utf8');
    console.log(`💾 Data saved to persistent storage`);
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
}

// Load data on startup
loadData();

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
  saveData(); // Persist to disk
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
    saveData(); // Persist to disk
    console.log(`🗑️ Deleted size chart for ${chartKey}`);
  }
  
  return existed;
}