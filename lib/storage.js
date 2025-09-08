// Multi-tier storage: Vercel KV -> Database -> File -> Memory fallback
import fs from 'fs';
import path from 'path';
import VercelKVStorage from './vercel-kv-storage.js';
// Database storage will be imported dynamically if needed

// Check if we're in a serverless environment (read-only filesystem)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

// Initialize storage tiers
let vercelKVStorage = null;
let databaseStorage = null;
let sizeChartsData = {};
let canWriteToFile = false;

// Define the storage file path
const STORAGE_DIR = path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'size-charts.json');

async function initializeStorage() {
  console.log('🚀 Initializing multi-tier storage system...');
  
  // Tier 1: Try Vercel KV first (best for serverless)
  try {
    vercelKVStorage = new VercelKVStorage();
    await vercelKVStorage.initialize();
    if (vercelKVStorage.isAvailable) {
      console.log('✅ Vercel KV storage ready (Tier 1)');
      return;
    }
  } catch (error) {
    console.log('⚠️ Vercel KV storage failed, trying database...');
  }

  // Tier 2: Try database second
  try {
    const { default: DatabaseStorage } = await import('./database-storage.js');
    databaseStorage = new DatabaseStorage();
    await databaseStorage.initialize();
    if (databaseStorage.isConnected) {
      console.log('✅ Database storage ready (Tier 2)');
      return;
    }
  } catch (error) {
    console.log('⚠️ Database storage failed, trying file storage...');
  }

  // Tier 3: File storage (local development)
  if (!isServerless) {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
        console.log('📁 Created data directory');
      }
      
      if (fs.existsSync(STORAGE_FILE)) {
        const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
        sizeChartsData = JSON.parse(fileContent);
        console.log(`📁 Loaded ${Object.keys(sizeChartsData).length} charts from file storage (Tier 2)`);
      } else {
        console.log('🆕 Initialized new file storage');
      }
      
      canWriteToFile = true;
      // Test write capability
      saveToFile();
      console.log('✅ File storage ready (Tier 3)');
      return;
    } catch (error) {
      console.error('❌ File storage failed:', error.message);
    }
  }

  // Tier 4: Memory storage (fallback)
  console.log('💭 Using memory storage (Tier 4) - data will not persist');
  if (isServerless) {
    console.log('☁️ Serverless environment detected');
    // Try to load from existing file if available (pre-deployed data)
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
        sizeChartsData = JSON.parse(fileContent);
        console.log(`📁 Loaded ${Object.keys(sizeChartsData).length} charts from pre-deployed data`);
      }
    } catch (error) {
      console.log('📝 No pre-deployed data found');
    }
  }
}

function saveToFile() {
  if (canWriteToFile) {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(sizeChartsData, null, 2), 'utf8');
      console.log(`💾 Data saved to file storage`);
    } catch (error) {
      console.error('❌ Error saving to file:', error.message);
      canWriteToFile = false;
    }
  }
}

// Initialize storage on startup
initializeStorage();

// Helper functions for chart operations
export async function saveChart(storeId, productId, chartData, unit = 'cm') {
  const chartKey = `${storeId}:${productId}`;
  
  // Try Vercel KV first (Tier 1)
  if (vercelKVStorage && vercelKVStorage.isAvailable) {
    try {
      const result = await vercelKVStorage.saveChart(storeId, productId, chartData, unit);
      console.log(`📊 Saved size chart to Vercel KV for ${chartKey}`);
      return result;
    } catch (error) {
      console.error('❌ Vercel KV save failed, trying database:', error.message);
    }
  }

  // Try database second (Tier 2)
  if (databaseStorage && databaseStorage.isConnected) {
    try {
      const result = await databaseStorage.saveChart(storeId, productId, chartData, unit);
      console.log(`📊 Saved size chart to database for ${chartKey}`);
      return result;
    } catch (error) {
      console.error('❌ Database save failed, trying file storage:', error.message);
    }
  }

  // Fallback to file/memory storage (Tier 3 & 4)
  const chartEntry = {
    store_id: storeId,
    product_id: productId,
    sizes: chartData,
    unit,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  sizeChartsData[chartKey] = chartEntry;
  saveToFile();
  console.log(`📊 Saved size chart to ${canWriteToFile ? 'file' : 'memory'} for ${chartKey}:`, Object.keys(chartData));
  console.log(`📈 Total charts in storage: ${Object.keys(sizeChartsData).length}`);
  return chartEntry;
}

export async function getChart(storeId, productId) {
  const chartKey = `${storeId}:${productId}`;
  
  // Try Vercel KV first (Tier 1)
  if (vercelKVStorage && vercelKVStorage.isAvailable) {
    try {
      const chart = await vercelKVStorage.getChart(storeId, productId);
      if (chart) {
        console.log(`📖 Retrieved size chart from Vercel KV for ${chartKey}:`, Object.keys(chart.sizes));
        return chart;
      }
    } catch (error) {
      console.error('❌ Vercel KV retrieval failed, trying database:', error.message);
    }
  }

  // Try database second (Tier 2)
  if (databaseStorage && databaseStorage.isConnected) {
    try {
      const chart = await databaseStorage.getChart(storeId, productId);
      if (chart) {
        console.log(`📖 Retrieved size chart from database for ${chartKey}:`, Object.keys(chart.sizes));
        return chart;
      }
    } catch (error) {
      console.error('❌ Database retrieval failed, trying file/memory storage:', error.message);
    }
  }

  // Fallback to file/memory storage (Tier 3 & 4)
  const chart = sizeChartsData[chartKey];
  
  if (chart) {
    console.log(`📖 Retrieved size chart from ${canWriteToFile ? 'file' : 'memory'} for ${chartKey}:`, Object.keys(chart.sizes));
  } else {
    console.log(`❌ No size chart found for ${chartKey}`);
  }
  
  return chart;
}

export async function getAllCharts(storeId) {
  // Try Vercel KV first (Tier 1)
  if (vercelKVStorage && vercelKVStorage.isAvailable) {
    try {
      const charts = await vercelKVStorage.getAllCharts(storeId);
      console.log(`📚 Found ${charts.length} charts in Vercel KV for store ${storeId}`);
      return charts;
    } catch (error) {
      console.error('❌ Vercel KV retrieval failed, trying database:', error.message);
    }
  }

  // Try database second (Tier 2)
  if (databaseStorage && databaseStorage.isConnected) {
    try {
      const charts = await databaseStorage.getAllCharts(storeId);
      console.log(`📚 Found ${charts.length} charts in database for store ${storeId}`);
      return charts;
    } catch (error) {
      console.error('❌ Database retrieval failed, trying file/memory storage:', error.message);
    }
  }

  // Fallback to file/memory storage (Tier 3 & 4)
  const storeCharts = [];
  
  for (const [key, chart] of Object.entries(sizeChartsData)) {
    if (chart.store_id === storeId) {
      storeCharts.push(chart);
    }
  }
  
  console.log(`📚 Found ${storeCharts.length} charts in ${canWriteToFile ? 'file' : 'memory'} for store ${storeId}`);
  return storeCharts;
}

export async function deleteChart(storeId, productId) {
  const chartKey = `${storeId}:${productId}`;
  
  // Try Vercel KV first (Tier 1)
  if (vercelKVStorage && vercelKVStorage.isAvailable) {
    try {
      const deleted = await vercelKVStorage.deleteChart(storeId, productId);
      if (deleted) {
        console.log(`🗑️ Deleted size chart from Vercel KV for ${chartKey}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Vercel KV deletion failed, trying database:', error.message);
    }
  }

  // Try database second (Tier 2)
  if (databaseStorage && databaseStorage.isConnected) {
    try {
      const deleted = await databaseStorage.deleteChart(storeId, productId);
      if (deleted) {
        console.log(`🗑️ Deleted size chart from database for ${chartKey}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Database deletion failed, trying file/memory storage:', error.message);
    }
  }

  // Fallback to file/memory storage (Tier 3 & 4)
  const existed = sizeChartsData[chartKey] !== undefined;
  
  if (existed) {
    delete sizeChartsData[chartKey];
    saveToFile();
    console.log(`🗑️ Deleted size chart from ${canWriteToFile ? 'file' : 'memory'} for ${chartKey}`);
  }
  
  return existed;
}