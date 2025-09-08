// Vercel KV (Redis) storage for size charts
import { kv } from '@vercel/kv';

class VercelKVStorage {
  constructor() {
    this.isAvailable = false;
    this.prefix = 'sizechart:';
  }

  async initialize() {
    try {
      // Check if Vercel KV is available
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        console.log('🔗 Vercel KV credentials found');
        
        // Test connection
        await kv.set(`${this.prefix}test`, 'connection-test', { ex: 10 });
        const testResult = await kv.get(`${this.prefix}test`);
        
        if (testResult === 'connection-test') {
          this.isAvailable = true;
          console.log('✅ Vercel KV connected successfully');
          
          // Clean up test key
          await kv.del(`${this.prefix}test`);
        } else {
          throw new Error('KV connection test failed');
        }
      } else {
        console.log('⚠️ Vercel KV environment variables not found');
        console.log('   Required: KV_REST_API_URL, KV_REST_API_TOKEN');
        this.isAvailable = false;
      }
    } catch (error) {
      console.error('❌ Vercel KV initialization failed:', error.message);
      this.isAvailable = false;
    }
  }

  getChartKey(storeId, productId) {
    return `${this.prefix}${storeId}:${productId}`;
  }

  getStoreKey(storeId) {
    return `${this.prefix}store:${storeId}`;
  }

  async saveChart(storeId, productId, chartData, unit = 'cm') {
    if (!this.isAvailable) {
      throw new Error('Vercel KV not available');
    }

    const chartKey = this.getChartKey(storeId, productId);
    const storeKey = this.getStoreKey(storeId);
    
    const chartEntry = {
      store_id: storeId,
      product_id: productId,
      sizes: chartData,
      unit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      // Save the chart data
      await kv.set(chartKey, JSON.stringify(chartEntry));
      
      // Add to store's chart list for easy retrieval
      await kv.sadd(storeKey, productId);
      
      console.log(`📊 Size chart saved to Vercel KV for ${storeId}:${productId}`);
      return chartEntry;
    } catch (error) {
      console.error('❌ Error saving to Vercel KV:', error.message);
      throw error;
    }
  }

  async getChart(storeId, productId) {
    if (!this.isAvailable) {
      throw new Error('Vercel KV not available');
    }

    const chartKey = this.getChartKey(storeId, productId);

    try {
      const chartData = await kv.get(chartKey);
      
      if (chartData) {
        const chart = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
        console.log(`📖 Retrieved size chart from Vercel KV for ${storeId}:${productId}`);
        return chart;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error retrieving from Vercel KV:', error.message);
      throw error;
    }
  }

  async getAllCharts(storeId) {
    if (!this.isAvailable) {
      throw new Error('Vercel KV not available');
    }

    const storeKey = this.getStoreKey(storeId);

    try {
      // Get all product IDs for this store
      const productIds = await kv.smembers(storeKey);
      
      if (!productIds || productIds.length === 0) {
        console.log(`📚 No charts found in Vercel KV for store ${storeId}`);
        return [];
      }

      // Get all chart data
      const charts = [];
      for (const productId of productIds) {
        const chart = await this.getChart(storeId, productId);
        if (chart) {
          charts.push(chart);
        }
      }

      console.log(`📚 Found ${charts.length} charts in Vercel KV for store ${storeId}`);
      return charts;
    } catch (error) {
      console.error('❌ Error retrieving all charts from Vercel KV:', error.message);
      throw error;
    }
  }

  async deleteChart(storeId, productId) {
    if (!this.isAvailable) {
      throw new Error('Vercel KV not available');
    }

    const chartKey = this.getChartKey(storeId, productId);
    const storeKey = this.getStoreKey(storeId);

    try {
      // Delete the chart data
      const deleted = await kv.del(chartKey);
      
      // Remove from store's chart list
      await kv.srem(storeKey, productId);
      
      if (deleted > 0) {
        console.log(`🗑️ Deleted size chart from Vercel KV for ${storeId}:${productId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error deleting from Vercel KV:', error.message);
      throw error;
    }
  }

  // Utility method to check connection status
  async getStats() {
    if (!this.isAvailable) {
      return { connected: false, error: 'KV not available' };
    }

    try {
      // Get some basic stats
      const testKey = `${this.prefix}stats-test`;
      await kv.set(testKey, 'test', { ex: 1 });
      const result = await kv.get(testKey);
      
      return {
        connected: result === 'test',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default VercelKVStorage;