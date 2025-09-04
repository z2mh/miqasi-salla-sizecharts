// Simple persistent storage for demo purposes
// In production, use a database like MongoDB or PostgreSQL

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const STORAGE_FILE = '/tmp/sizecharts.json';

// Load existing data or create empty storage
let sizeChartsData = {};

try {
  if (existsSync(STORAGE_FILE)) {
    const fileContent = readFileSync(STORAGE_FILE, 'utf8');
    sizeChartsData = JSON.parse(fileContent);
    console.log(`📁 Loaded ${Object.keys(sizeChartsData).length} size charts from storage`);
  }
} catch (error) {
  console.log('🆕 Creating new storage file');
  sizeChartsData = {};
}

// Save data to file
function saveToFile() {
  try {
    writeFileSync(STORAGE_FILE, JSON.stringify(sizeChartsData, null, 2));
  } catch (error) {
    console.error('❌ Failed to save storage:', error);
  }
}

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
  saveToFile();
  console.log(`📊 Saved size chart for ${chartKey}:`, Object.keys(chartData));
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
    saveToFile();
    console.log(`🗑️ Deleted size chart for ${chartKey}`);
  }
  
  return existed;
}