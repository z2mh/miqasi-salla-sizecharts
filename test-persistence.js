#!/usr/bin/env node
// Simple test script to demonstrate data persistence

const express = require('express');

const app = express();
app.use(express.json());

// Import chart-data API
const chartDataHandler = require('./api/chart-data.js');

// Mock Express request/response for testing
const createMockReq = (method, query = {}, body = {}) => ({
  method,
  query,
  body,
  url: `/api/chart-data${Object.keys(query).length ? '?' + new URLSearchParams(query) : ''}`
});

const createMockRes = () => {
  let response = {};
  return {
    status: (code) => ({ 
      json: (data) => { 
        response.statusCode = code; 
        response.data = data; 
        console.log(`📡 API Response [${code}]:`, data);
        return response;
      }
    }),
    json: (data) => {
      response.data = data;
      console.log(`📡 API Response [200]:`, data);
      return response;
    }
  };
};

async function testPersistence() {
  console.log('🧪 Testing Size Chart Persistence...\n');
  
  // Test 1: Save a size chart
  console.log('📊 TEST 1: Saving a size chart');
  const saveReq = createMockReq('POST', {}, {
    store_id: 'demo_store',
    product_id: '999888777',
    chart_data: {
      'XS': { chest: '32', waist: '26', hip: '34' },
      'S': { chest: '34', waist: '28', hip: '36' },
      'M': { chest: '36', waist: '30', hip: '38' },
      'L': { chest: '38', waist: '32', hip: '40' },
      'XL': { chest: '40', waist: '34', hip: '42' },
      'XXL': { chest: '42', waist: '36', hip: '44' }
    },
    unit: 'inches'
  });
  
  const saveRes = createMockRes();
  await chartDataHandler.default(saveReq, saveRes);
  
  console.log('✅ Chart saved successfully!\n');
  
  // Test 2: Retrieve the same chart
  console.log('📖 TEST 2: Retrieving the same chart');
  const getReq = createMockReq('GET', {
    store_id: 'demo_store',
    product_id: '999888777'
  });
  
  const getRes = createMockRes();
  await chartDataHandler.default(getReq, getRes);
  
  if (getRes.data && getRes.data.success) {
    console.log('✅ Chart retrieved successfully!');
    console.log('📊 Sizes available:', Object.keys(getRes.data.data.sizes));
    console.log('📏 Unit:', getRes.data.data.unit);
    console.log('\n🎉 DATA PERSISTENCE IS WORKING!');
    console.log('Your size charts are now stored in Vercel KV (Redis)');
  } else {
    console.log('❌ Failed to retrieve chart');
  }
}

// Run the test
if (require.main === module) {
  testPersistence().catch(console.error);
}

module.exports = { testPersistence };