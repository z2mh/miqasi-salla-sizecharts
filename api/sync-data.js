// Enhanced data synchronization with Salla API
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
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

    // 1. Sync Store Basic Info
    if (sync_type === 'all' || sync_type === 'store') {
      try {
        const storeResponse = await fetch(`${SALLA_API_BASE}/store/info`, { headers });
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          
          const storeInfo = {
            store_id,
            name: storeData.data?.name || 'Unknown Store',
            currency: storeData.data?.currency || 'SAR',
            timezone: storeData.data?.timezone || 'Asia/Riyadh',
            domain: storeData.data?.domain,
            created_at: storeData.data?.created_at,
            last_synced: new Date().toISOString()
          };
          
          await kv.set(`store:${store_id}`, JSON.stringify(storeInfo));
          syncResults.store = 'success';
        }
      } catch (error) {
        syncResults.store = `error: ${error.message}`;
      }
    }

    // 2. Sync Store Settings  
    if (sync_type === 'all' || sync_type === 'settings') {
      try {
        const settingsResponse = await fetch(`${SALLA_API_BASE}/store/settings`, { headers });
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          
          const storeSettings = {
            store_id,
            settings: settingsData.data || {},
            last_synced: new Date().toISOString()
          };
          
          await kv.set(`store:settings:${store_id}`, JSON.stringify(storeSettings));
          syncResults.settings = 'success';
        }
      } catch (error) {
        syncResults.settings = `error: ${error.message}`;
      }
    }

    // 3. Sync Categories
    if (sync_type === 'all' || sync_type === 'categories') {
      try {
        const categoriesResponse = await fetch(`${SALLA_API_BASE}/categories`, { headers });
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          
          const categories = {
            store_id,
            categories: categoriesData.data?.map(cat => ({
              id: cat.id,
              name: cat.name,
              parent_id: cat.parent_id,
              status: cat.status,
              products_count: cat.products_count || 0
            })) || [],
            total_count: categoriesData.data?.length || 0,
            last_synced: new Date().toISOString()
          };
          
          await kv.set(`categories:${store_id}`, JSON.stringify(categories));
          syncResults.categories = `success - ${categories.total_count} categories`;
        }
      } catch (error) {
        syncResults.categories = `error: ${error.message}`;
      }
    }

    // 4. Sync Products (Enhanced)
    if (sync_type === 'all' || sync_type === 'products') {
      try {
        let page = 1;
        let totalProducts = 0;
        let hasMore = true;

        while (hasMore && page <= 10) { // Limit to 10 pages to prevent timeout
          const productsResponse = await fetch(
            `${SALLA_API_BASE}/products?per_page=50&page=${page}`, 
            { headers }
          );
          
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            const products = productsData.data || [];
            
            // Store each product individually with enhanced data
            for (const product of products) {
              // Check if product has existing size chart
              const chartKey = `sizechart:${store_id}:${product.id}`;
              const existingChart = await kv.get(chartKey);
              
              const enhancedProduct = {
                store_id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                sale_price: product.sale_price,
                category_id: product.category_id,
                status: product.status,
                sku: product.sku,
                quantity: product.quantity,
                images: product.images?.map(img => img.url) || [],
                has_size_chart: !!existingChart,
                size_chart_created_at: existingChart ? 
                  (typeof existingChart === 'string' ? 
                    JSON.parse(existingChart).created_at : 
                    existingChart.created_at) : null,
                last_synced: new Date().toISOString()
              };
              
              await kv.set(`product:${store_id}:${product.id}`, JSON.stringify(enhancedProduct));
              totalProducts++;
            }
            
            // Check if there are more pages
            hasMore = products.length === 50;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        syncResults.products = `success - ${totalProducts} products synced`;
      } catch (error) {
        syncResults.products = `error: ${error.message}`;
      }
    }

    // 5. Sync Orders (Enhanced with Size Analytics)
    if (sync_type === 'all' || sync_type === 'orders') {
      try {
        let page = 1;
        let totalOrders = 0;
        let hasMore = true;
        const sizeAnalytics = {}; // Track size performance

        // Get orders from last 30 days for performance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

        while (hasMore && page <= 10) { // Limit to prevent timeout
          const ordersResponse = await fetch(
            `${SALLA_API_BASE}/orders?per_page=50&page=${page}&from=${fromDate}`, 
            { headers }
          );
          
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            const orders = ordersData.data || [];
            
            for (const order of orders) {
              // Store order with enhanced analytics data
              const enhancedOrder = {
                store_id,
                order_id: order.id,
                customer_id: order.customer?.id,
                total_amount: parseFloat(order.total?.amount || 0),
                status: order.status,
                created_at: order.created_at,
                currency: order.currency,
                items: order.items?.map(item => ({
                  product_id: item.product?.id,
                  product_name: item.product?.name,
                  quantity: item.quantity,
                  price: parseFloat(item.price || 0),
                  variant: item.variant_name || item.options?.size || null, // Size info
                  sku: item.sku
                })) || [],
                has_size_chart_products: false,
                last_synced: new Date().toISOString()
              };

              // Check if any items have size charts and track size performance
              for (const item of enhancedOrder.items) {
                if (item.product_id) {
                  const chartKey = `sizechart:${store_id}:${item.product_id}`;
                  const hasChart = await kv.get(chartKey);
                  
                  if (hasChart) {
                    enhancedOrder.has_size_chart_products = true;
                    
                    // Track size analytics
                    const productKey = item.product_id;
                    if (!sizeAnalytics[productKey]) {
                      sizeAnalytics[productKey] = {
                        product_id: productKey,
                        product_name: item.product_name,
                        total_orders: 0,
                        total_revenue: 0,
                        size_breakdown: {}
                      };
                    }
                    
                    sizeAnalytics[productKey].total_orders += item.quantity;
                    sizeAnalytics[productKey].total_revenue += item.price * item.quantity;
                    
                    // Track by size if available
                    const size = item.variant || 'Unknown';
                    if (!sizeAnalytics[productKey].size_breakdown[size]) {
                      sizeAnalytics[productKey].size_breakdown[size] = {
                        orders: 0,
                        revenue: 0,
                        quantity: 0
                      };
                    }
                    
                    sizeAnalytics[productKey].size_breakdown[size].orders += 1;
                    sizeAnalytics[productKey].size_breakdown[size].quantity += item.quantity;
                    sizeAnalytics[productKey].size_breakdown[size].revenue += item.price * item.quantity;
                  }
                }
              }
              
              await kv.set(`order:${store_id}:${order.id}`, JSON.stringify(enhancedOrder));
              totalOrders++;
            }
            
            hasMore = orders.length === 50;
            page++;
          } else {
            hasMore = false;
          }
        }

        // Save size analytics
        for (const [productId, analytics] of Object.entries(sizeAnalytics)) {
          const analyticsKey = `size_analytics:${store_id}:${productId}`;
          const existingAnalytics = await kv.get(analyticsKey);
          
          let updatedAnalytics = {
            ...analytics,
            last_updated: new Date().toISOString()
          };
          
          // Merge with existing data if available
          if (existingAnalytics) {
            const existing = typeof existingAnalytics === 'string' ? 
              JSON.parse(existingAnalytics) : existingAnalytics;
            
            // Combine size breakdowns
            for (const [size, data] of Object.entries(analytics.size_breakdown)) {
              if (existing.size_breakdown && existing.size_breakdown[size]) {
                updatedAnalytics.size_breakdown[size].orders += existing.size_breakdown[size].orders || 0;
                updatedAnalytics.size_breakdown[size].quantity += existing.size_breakdown[size].quantity || 0;
                updatedAnalytics.size_breakdown[size].revenue += existing.size_breakdown[size].revenue || 0;
              }
            }
          }
          
          await kv.set(analyticsKey, JSON.stringify(updatedAnalytics));
        }
        
        syncResults.orders = `success - ${totalOrders} orders synced, ${Object.keys(sizeAnalytics).length} products analyzed`;
      } catch (error) {
        syncResults.orders = `error: ${error.message}`;
      }
    }

    // 6. Update Analytics
    const today = new Date().toISOString().split('T')[0];
    const analyticsKey = `analytics:${store_id}:daily:${today}`;
    
    try {
      let analytics = await kv.get(analyticsKey);
      if (typeof analytics === 'string') {
        analytics = JSON.parse(analytics);
      }
      
      if (!analytics) {
        analytics = {
          date: today,
          store_id,
          syncs_performed: 0,
          last_sync_type: sync_type,
          last_sync_time: new Date().toISOString()
        };
      }
      
      analytics.syncs_performed = (analytics.syncs_performed || 0) + 1;
      analytics.last_sync_type = sync_type;
      analytics.last_sync_time = new Date().toISOString();
      
      await kv.set(analyticsKey, JSON.stringify(analytics));
      syncResults.analytics = 'updated';
    } catch (error) {
      syncResults.analytics = `error: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Data synchronization completed',
      sync_type,
      results: syncResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      success: false,
      error: 'Synchronization failed',
      message: error.message
    });
  }
}