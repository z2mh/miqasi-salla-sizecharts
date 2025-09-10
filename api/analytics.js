// Analytics endpoint to extract insights from stored data
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { store_id, report_type = 'overview' } = req.query;
    
    if (!store_id) {
      return res.status(400).json({ 
        error: 'Missing store_id parameter' 
      });
    }

    let analyticsData = {};

    if (report_type === 'overview' || report_type === 'all') {
      // 1. Store Overview
      const storeInfo = await kv.get(`store:${store_id}`);
      const storeData = typeof storeInfo === 'string' ? JSON.parse(storeInfo) : storeInfo;
      
      // 2. Categories Analysis
      const categoriesInfo = await kv.get(`categories:${store_id}`);
      const categoriesData = typeof categoriesInfo === 'string' ? JSON.parse(categoriesInfo) : categoriesInfo;
      
      // 3. Products with Size Charts Analysis
      const storeKey = `sizechart:store:${store_id}`;
      const productIds = await kv.smembers(storeKey) || [];
      
      let productsWithCharts = 0;
      let totalSizesCreated = 0;
      let categoriesWithCharts = new Set();
      let chartsByCategory = {};
      
      for (const productId of productIds) {
        const chartKey = `sizechart:${store_id}:${productId}`;
        const chartData = await kv.get(chartKey);
        
        if (chartData) {
          const chart = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
          productsWithCharts++;
          
          // Count active sizes only
          const activeSizes = Object.values(chart.sizes || {})
            .filter(size => !size.status || size.status === 'active');
          totalSizesCreated += activeSizes.length;
          
          // Get product category
          const productInfo = await kv.get(`product:${store_id}:${productId}`);
          if (productInfo) {
            const product = typeof productInfo === 'string' ? JSON.parse(productInfo) : productInfo;
            if (product.category_id) {
              categoriesWithCharts.add(product.category_id);
              chartsByCategory[product.category_id] = (chartsByCategory[product.category_id] || 0) + 1;
            }
          }
        }
      }

      analyticsData.overview = {
        store_name: storeData?.name || 'Unknown',
        total_categories: categoriesData?.total_count || 0,
        total_products_with_charts: productsWithCharts,
        total_sizes_created: totalSizesCreated,
        categories_with_charts: categoriesWithCharts.size,
        avg_sizes_per_product: productsWithCharts > 0 ? Math.round(totalSizesCreated / productsWithCharts * 100) / 100 : 0,
        last_sync: storeData?.last_synced || 'Never'
      };
    }

    if (report_type === 'categories' || report_type === 'all') {
      // Categories Performance Report
      const categoriesInfo = await kv.get(`categories:${store_id}`);
      const categoriesData = typeof categoriesInfo === 'string' ? JSON.parse(categoriesInfo) : categoriesData;
      
      const categoryAnalytics = [];
      
      if (categoriesData?.categories) {
        for (const category of categoriesData.categories) {
          // Count products with size charts in this category
          let chartsInCategory = 0;
          
          // This is a simplified approach - in a real scenario you'd want to index this better
          const storeKey = `sizechart:store:${store_id}`;
          const productIds = await kv.smembers(storeKey) || [];
          
          for (const productId of productIds) {
            const productInfo = await kv.get(`product:${store_id}:${productId}`);
            if (productInfo) {
              const product = typeof productInfo === 'string' ? JSON.parse(productInfo) : productInfo;
              if (product.category_id === category.id) {
                chartsInCategory++;
              }
            }
          }
          
          categoryAnalytics.push({
            id: category.id,
            name: category.name,
            total_products: category.products_count || 0,
            products_with_size_charts: chartsInCategory,
            chart_adoption_rate: category.products_count > 0 ? 
              Math.round((chartsInCategory / category.products_count) * 100) : 0
          });
        }
      }
      
      analyticsData.categories = categoryAnalytics.sort((a, b) => b.products_with_size_charts - a.products_with_size_charts);
    }

    if (report_type === 'recent_activity' || report_type === 'all') {
      // Recent Activity (last 7 days)
      const last7Days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        last7Days.push(dateString);
      }
      
      const recentActivity = [];
      for (const date of last7Days) {
        const analyticsKey = `analytics:${store_id}:daily:${date}`;
        const dayData = await kv.get(analyticsKey);
        
        if (dayData) {
          const data = typeof dayData === 'string' ? JSON.parse(dayData) : dayData;
          recentActivity.push({
            date,
            syncs_performed: data.syncs_performed || 0,
            last_sync_type: data.last_sync_type || 'unknown'
          });
        } else {
          recentActivity.push({
            date,
            syncs_performed: 0,
            last_sync_type: null
          });
        }
      }
      
      analyticsData.recent_activity = recentActivity.reverse();
    }

    if (report_type === 'size_performance' || report_type === 'all') {
      // Size Performance Analytics (requires order data)
      const sizePerformance = [];
      
      // Get all products with size analytics
      const storeKey = `sizechart:store:${store_id}`;
      const productIds = await kv.smembers(storeKey) || [];
      
      for (const productId of productIds) {
        const analyticsKey = `size_analytics:${store_id}:${productId}`;
        const sizeData = await kv.get(analyticsKey);
        
        if (sizeData) {
          const data = typeof sizeData === 'string' ? JSON.parse(sizeData) : sizeData;
          
          // Calculate size insights
          const sizes = Object.entries(data.size_breakdown || {});
          const totalOrders = sizes.reduce((sum, [_, sizeData]) => sum + sizeData.orders, 0);
          const totalRevenue = sizes.reduce((sum, [_, sizeData]) => sum + sizeData.revenue, 0);
          
          const sizeBreakdown = sizes.map(([sizeName, sizeData]) => ({
            size: sizeName,
            orders: sizeData.orders,
            quantity: sizeData.quantity,
            revenue: Math.round(sizeData.revenue * 100) / 100,
            percentage: totalOrders > 0 ? Math.round((sizeData.orders / totalOrders) * 100) : 0
          })).sort((a, b) => b.orders - a.orders);
          
          if (totalOrders > 0) {
            sizePerformance.push({
              product_id: productId,
              product_name: data.product_name,
              total_orders: totalOrders,
              total_revenue: Math.round(totalRevenue * 100) / 100,
              most_popular_size: sizeBreakdown[0]?.size || 'Unknown',
              least_popular_size: sizeBreakdown[sizeBreakdown.length - 1]?.size || 'Unknown',
              size_breakdown: sizeBreakdown,
              avg_order_value: Math.round((totalRevenue / totalOrders) * 100) / 100
            });
          }
        }
      }
      
      analyticsData.size_performance = sizePerformance.sort((a, b) => b.total_revenue - a.total_revenue);
    }

    if (report_type === 'roi_analysis' || report_type === 'all') {
      // ROI Analysis - Compare products with vs without size charts
      const roiAnalysis = {
        products_with_charts: 0,
        products_without_charts: 0,
        revenue_with_charts: 0,
        revenue_without_charts: 0,
        orders_with_charts: 0,
        orders_without_charts: 0,
        conversion_improvement: 0
      };
      
      // Get all orders from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // This is a simplified calculation - in production you'd want to scan order keys
      const storeKey = `sizechart:store:${store_id}`;
      const productsWithCharts = await kv.smembers(storeKey) || [];
      
      for (const productId of productsWithCharts) {
        const analyticsKey = `size_analytics:${store_id}:${productId}`;
        const sizeData = await kv.get(analyticsKey);
        
        if (sizeData) {
          const data = typeof sizeData === 'string' ? JSON.parse(sizeData) : sizeData;
          roiAnalysis.products_with_charts++;
          roiAnalysis.revenue_with_charts += data.total_revenue || 0;
          roiAnalysis.orders_with_charts += data.total_orders || 0;
        }
      }
      
      // Calculate performance metrics
      if (roiAnalysis.products_with_charts > 0) {
        roiAnalysis.avg_revenue_per_product_with_charts = 
          Math.round((roiAnalysis.revenue_with_charts / roiAnalysis.products_with_charts) * 100) / 100;
        roiAnalysis.avg_orders_per_product_with_charts = 
          Math.round((roiAnalysis.orders_with_charts / roiAnalysis.products_with_charts) * 100) / 100;
      }
      
      analyticsData.roi_analysis = roiAnalysis;
    }

    if (report_type === 'trending_sizes' || report_type === 'all') {
      // Trending Sizes Across All Products
      const trendingSizes = {};
      
      const storeKey = `sizechart:store:${store_id}`;
      const productIds = await kv.smembers(storeKey) || [];
      
      for (const productId of productIds) {
        const analyticsKey = `size_analytics:${store_id}:${productId}`;
        const sizeData = await kv.get(analyticsKey);
        
        if (sizeData) {
          const data = typeof sizeData === 'string' ? JSON.parse(sizeData) : sizeData;
          
          for (const [sizeName, sizeInfo] of Object.entries(data.size_breakdown || {})) {
            if (!trendingSizes[sizeName]) {
              trendingSizes[sizeName] = {
                size: sizeName,
                total_orders: 0,
                total_revenue: 0,
                products_count: 0
              };
            }
            
            trendingSizes[sizeName].total_orders += sizeInfo.orders || 0;
            trendingSizes[sizeName].total_revenue += sizeInfo.revenue || 0;
            trendingSizes[sizeName].products_count += 1;
          }
        }
      }
      
      const trendingArray = Object.values(trendingSizes)
        .map(size => ({
          ...size,
          avg_revenue_per_order: size.total_orders > 0 ? 
            Math.round((size.total_revenue / size.total_orders) * 100) / 100 : 0
        }))
        .sort((a, b) => b.total_orders - a.total_orders);
      
      analyticsData.trending_sizes = trendingArray;
    }

    if (report_type === 'recommendations' || report_type === 'all') {
      // Business Recommendations
      const recommendations = [];
      
      // Get overview data for recommendations
      const storeKey = `sizechart:store:${store_id}`;
      const productIds = await kv.smembers(storeKey) || [];
      const totalProducts = productIds.length;
      
      if (totalProducts === 0) {
        recommendations.push({
          type: 'action',
          priority: 'high',
          title: 'ابدأ بإنشاء أول جدول مقاسات',
          description: 'لم يتم إنشاء أي جداول مقاسات بعد. ابدأ بالمنتجات الأكثر مبيعاً.'
        });
      } else if (totalProducts < 5) {
        recommendations.push({
          type: 'growth',
          priority: 'medium',
          title: 'أضف المزيد من جداول المقاسات',
          description: `لديك ${totalProducts} منتجات فقط مع جداول مقاسات. أضف المزيد لتحسين تجربة العملاء.`
        });
      }
      
      // Check for categories without size charts
      const categoriesInfo = await kv.get(`categories:${store_id}`);
      const categoriesData = typeof categoriesInfo === 'string' ? JSON.parse(categoriesInfo) : categoriesInfo;
      
      if (categoriesData?.categories?.length > 0) {
        let categoriesWithoutCharts = 0;
        for (const category of categoriesData.categories) {
          // Check if category has any products with charts
          let hasCharts = false;
          for (const productId of productIds) {
            const productInfo = await kv.get(`product:${store_id}:${productId}`);
            if (productInfo) {
              const product = typeof productInfo === 'string' ? JSON.parse(productInfo) : productInfo;
              if (product.category_id === category.id) {
                hasCharts = true;
                break;
              }
            }
          }
          if (!hasCharts && category.products_count > 0) {
            categoriesWithoutCharts++;
          }
        }
        
        if (categoriesWithoutCharts > 0) {
          recommendations.push({
            type: 'expansion',
            priority: 'medium',
            title: 'وسع جداول المقاسات لفئات جديدة',
            description: `${categoriesWithoutCharts} فئة من المنتجات لا تحتوي على جداول مقاسات.`
          });
        }
      }
      
      analyticsData.recommendations = recommendations;
    }

    return res.status(200).json({
      success: true,
      store_id,
      report_type,
      data: analyticsData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      message: error.message
    });
  }
}