// Consolidated API handler for all Miqasi operations
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const route = pathname.replace('/api/', '');

  try {
    console.log('🔥 API Called:', {
      route,
      method: req.method,
      query: req.query,
      body: req.body
    });

    // Route to appropriate handler
    switch (route) {
      case 'chart-data':
        return await handleChartData(req, res);
      case 'sync-data':
        return await handleSyncData(req, res);
      case 'analytics':
        return await handleAnalytics(req, res);
      case 'products':
        return await handleProducts(req, res);
      case 'auth':
        return await handleAuth(req, res);
      case 'dashboard':
        return await handleDashboard(req, res);
      case 'test-kv':
        return await handleTestKV(req, res);
      default:
        return res.status(404).json({ error: 'API route not found' });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}

// Chart Data Handler (GET/POST size charts)
async function handleChartData(req, res) {
  if (req.method === 'GET') {
    const { store_id, product_id } = req.query;
    
    if (!store_id || !product_id) {
      return res.status(400).json({ 
        error: 'Missing required parameters: store_id, product_id' 
      });
    }

    const chartKey = `sizechart:${store_id}:${product_id}`;
    let chartData = await kv.get(chartKey);
    
    // Fallback: try with demo_store if not found
    if (!chartData) {
      const fallbackKey = `sizechart:demo_store:${product_id}`;
      chartData = await kv.get(fallbackKey);
    }
    
    if (!chartData) {
      return res.status(404).json({ 
        success: false,
        message: 'No size chart found for this product'
      });
    }

    return res.status(200).json({
      success: true,
      data: typeof chartData === 'string' ? JSON.parse(chartData) : chartData
    });
  }

  if (req.method === 'POST') {
    const { store_id, product_id, chart_data, unit } = req.body;
    
    if (!store_id || !product_id || !chart_data) {
      return res.status(400).json({ 
        error: 'Missing required fields: store_id, product_id, chart_data' 
      });
    }

    const chartKey = `sizechart:${store_id}:${product_id}`;
    const storeKey = `sizechart:store:${store_id}`;
    
    // Check if chart already exists to preserve created_at date
    let existingChart = null;
    try {
      existingChart = await kv.get(chartKey);
      if (typeof existingChart === 'string') {
        existingChart = JSON.parse(existingChart);
      }
    } catch (error) {
      // Chart doesn't exist, will create new
    }
    
    const chartEntry = {
      store_id,
      product_id,
      sizes: chart_data,
      unit: unit || 'cm',
      created_at: existingChart?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save chart to KV
    await kv.set(chartKey, JSON.stringify(chartEntry));
    
    // Add to store's product list
    await kv.sadd(storeKey, product_id);
    
    return res.status(200).json({
      success: true,
      message: 'Size chart saved successfully',
      chart_id: `${store_id}:${product_id}`,
      data: chartEntry
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Sync Data Handler (Sync from Salla API)
async function handleSyncData(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { store_id, access_token, sync_type = 'all' } = req.body;
  
  if (!store_id || !access_token) {
    return res.status(400).json({ 
      error: 'Missing store_id or access_token' 
    });
  }

  const SALLA_API_BASE = 'https://api.salla.dev/admin/v2';
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  };

  const syncResults = {};

  // Sync Products
  if (sync_type === 'all' || sync_type === 'products') {
    try {
      const productsResponse = await fetch(`${SALLA_API_BASE}/products?per_page=50`, { headers });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const products = productsData.data || [];
        
        for (const product of products) {
          const chartKey = `sizechart:${store_id}:${product.id}`;
          const existingChart = await kv.get(chartKey);
          
          const enhancedProduct = {
            store_id,
            product_id: product.id,
            name: product.name,
            price: product.price,
            category_id: product.category_id,
            status: product.status,
            has_size_chart: !!existingChart,
            last_synced: new Date().toISOString()
          };
          
          await kv.set(`product:${store_id}:${product.id}`, JSON.stringify(enhancedProduct));
        }
        
        syncResults.products = `success - ${products.length} products synced`;
      }
    } catch (error) {
      syncResults.products = `error: ${error.message}`;
    }
  }

  // Sync Orders (simplified for space)
  if (sync_type === 'all' || sync_type === 'orders') {
    try {
      const ordersResponse = await fetch(`${SALLA_API_BASE}/orders?per_page=50`, { headers });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.data || [];
        
        for (const order of orders) {
          const enhancedOrder = {
            store_id,
            order_id: order.id,
            total_amount: parseFloat(order.total?.amount || 0),
            status: order.status,
            created_at: order.created_at,
            items: order.items?.map(item => ({
              product_id: item.product?.id,
              product_name: item.product?.name,
              quantity: item.quantity,
              price: parseFloat(item.price || 0),
              variant: item.variant_name || null
            })) || [],
            last_synced: new Date().toISOString()
          };
          
          await kv.set(`order:${store_id}:${order.id}`, JSON.stringify(enhancedOrder));
        }
        
        syncResults.orders = `success - ${orders.length} orders synced`;
      }
    } catch (error) {
      syncResults.orders = `error: ${error.message}`;
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Data synchronization completed',
    results: syncResults
  });
}

// Analytics Handler
async function handleAnalytics(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { store_id, report_type = 'overview' } = req.query;
  
  if (!store_id) {
    return res.status(400).json({ 
      error: 'Missing store_id parameter' 
    });
  }

  let analyticsData = {};

  // Overview Analytics
  if (report_type === 'overview' || report_type === 'all') {
    const storeKey = `sizechart:store:${store_id}`;
    const productIds = await kv.smembers(storeKey) || [];
    
    let productsWithCharts = 0;
    let totalSizesCreated = 0;
    
    for (const productId of productIds) {
      const chartKey = `sizechart:${store_id}:${productId}`;
      const chartData = await kv.get(chartKey);
      
      if (chartData) {
        const chart = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
        productsWithCharts++;
        
        const activeSizes = Object.values(chart.sizes || {})
          .filter(size => !size.status || size.status === 'active');
        totalSizesCreated += activeSizes.length;
      }
    }

    analyticsData.overview = {
      total_products_with_charts: productsWithCharts,
      total_sizes_created: totalSizesCreated,
      avg_sizes_per_product: productsWithCharts > 0 ? Math.round(totalSizesCreated / productsWithCharts * 100) / 100 : 0
    };
  }

  return res.status(200).json({
    success: true,
    store_id,
    report_type,
    data: analyticsData,
    generated_at: new Date().toISOString()
  });
}

// Products Handler (Mock for demo)
async function handleProducts(req, res) {
  const mockProducts = [
    { id: '12345', name: "قميص رجالي كلاسيكي", price: "75.00", currency: "SAR" },
    { id: '67890', name: "بنطلون جينز أزرق", price: "120.00", currency: "SAR" },
    { id: '11111', name: "فستان صيفي أنيق", price: "95.00", currency: "SAR" }
  ];
  
  return res.json(mockProducts);
}

// Auth Handler (placeholder)
async function handleAuth(req, res) {
  return res.json({
    message: "Auth endpoint - implement OAuth flow here",
    status: "placeholder"
  });
}

// Dashboard Handler
async function handleDashboard(req, res) {
  return res.json({
    message: "Dashboard API endpoint",
    status: "active"
  });
}

// Test KV Handler
async function handleTestKV(req, res) {
  try {
    // Test KV connection
    await kv.set('test', 'connection works');
    const result = await kv.get('test');
    
    
    return res.json({
      success: true,
      message: 'KV connection working',
      test_result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'KV connection failed',
      message: error.message
    });
  }
}