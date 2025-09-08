// Database-based storage for size charts
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const SallaDatabase = require('../database/index');

class DatabaseStorage {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.fallbackStorage = {}; // Memory fallback if DB fails
  }

  async initialize() {
    try {
      if (process.env.SALLA_DATABASE_ORM) {
        console.log(`🗄️ Initializing ${process.env.SALLA_DATABASE_ORM} database connection...`);
        this.db = SallaDatabase(process.env.SALLA_DATABASE_ORM);
        this.connection = await this.db.connect();
        
        if (this.connection) {
          this.isConnected = true;
          console.log('✅ Database connected successfully for size charts');
          
          // Ensure size_charts table exists (for development)
          if (process.env.SALLA_DATABASE_ORM === 'Sequelize' && this.connection.models.SizeChart) {
            await this.connection.models.SizeChart.sync({ alter: false });
            console.log('📊 SizeChart table ready');
          }
        } else {
          throw new Error('Database connection failed');
        }
      } else {
        throw new Error('No database ORM specified');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      console.log('💭 Falling back to memory storage');
      this.isConnected = false;
    }
  }

  async saveChart(storeId, productId, chartData, unit = 'cm') {
    const chartKey = `${storeId}:${productId}`;
    const chartEntry = {
      store_id: storeId,
      product_id: productId,
      chart_data: chartData,
      unit,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      if (this.isConnected && this.connection && this.connection.models.SizeChart) {
        // Database storage
        const [chart, created] = await this.connection.models.SizeChart.upsert({
          store_id: storeId,
          product_id: productId,
          chart_data: chartData,
          unit
        });
        
        console.log(`📊 Size chart ${created ? 'created' : 'updated'} in database for ${chartKey}`);
        return {
          store_id: storeId,
          product_id: productId,
          sizes: chartData,
          unit,
          created_at: chart.createdAt,
          updated_at: chart.updatedAt
        };
      } else {
        throw new Error('Database not available');
      }
    } catch (error) {
      console.error('❌ Database save failed, using memory fallback:', error.message);
      // Fallback to memory storage
      this.fallbackStorage[chartKey] = {
        store_id: storeId,
        product_id: productId,
        sizes: chartData,
        unit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log(`💭 Size chart saved to memory for ${chartKey}`);
      return this.fallbackStorage[chartKey];
    }
  }

  async getChart(storeId, productId) {
    const chartKey = `${storeId}:${productId}`;

    try {
      if (this.isConnected && this.connection && this.connection.models.SizeChart) {
        // Database retrieval
        const chart = await this.connection.models.SizeChart.findOne({
          where: { store_id: storeId, product_id: productId }
        });
        
        if (chart) {
          console.log(`📖 Retrieved size chart from database for ${chartKey}`);
          return {
            store_id: chart.store_id,
            product_id: chart.product_id,
            sizes: chart.chart_data, // This will be automatically parsed due to getter
            unit: chart.unit,
            created_at: chart.createdAt,
            updated_at: chart.updatedAt
          };
        }
        return null;
      } else {
        throw new Error('Database not available');
      }
    } catch (error) {
      console.error('❌ Database retrieval failed, checking memory fallback:', error.message);
      // Fallback to memory storage
      const chart = this.fallbackStorage[chartKey];
      if (chart) {
        console.log(`💭 Retrieved size chart from memory for ${chartKey}`);
      }
      return chart || null;
    }
  }

  async getAllCharts(storeId) {
    try {
      if (this.isConnected && this.connection && this.connection.models.SizeChart) {
        // Database retrieval
        const charts = await this.connection.models.SizeChart.findAll({
          where: { store_id: storeId }
        });
        
        console.log(`📚 Found ${charts.length} charts in database for store ${storeId}`);
        return charts.map(chart => ({
          store_id: chart.store_id,
          product_id: chart.product_id,
          sizes: chart.chart_data,
          unit: chart.unit,
          created_at: chart.createdAt,
          updated_at: chart.updatedAt
        }));
      } else {
        throw new Error('Database not available');
      }
    } catch (error) {
      console.error('❌ Database retrieval failed, checking memory fallback:', error.message);
      // Fallback to memory storage
      const storeCharts = [];
      for (const [key, chart] of Object.entries(this.fallbackStorage)) {
        if (chart.store_id === storeId) {
          storeCharts.push(chart);
        }
      }
      console.log(`💭 Found ${storeCharts.length} charts in memory for store ${storeId}`);
      return storeCharts;
    }
  }

  async deleteChart(storeId, productId) {
    const chartKey = `${storeId}:${productId}`;

    try {
      if (this.isConnected && this.connection && this.connection.models.SizeChart) {
        // Database deletion
        const deleted = await this.connection.models.SizeChart.destroy({
          where: { store_id: storeId, product_id: productId }
        });
        
        if (deleted > 0) {
          console.log(`🗑️ Deleted size chart from database for ${chartKey}`);
          return true;
        }
        return false;
      } else {
        throw new Error('Database not available');
      }
    } catch (error) {
      console.error('❌ Database deletion failed, using memory fallback:', error.message);
      // Fallback to memory storage
      const existed = this.fallbackStorage[chartKey] !== undefined;
      if (existed) {
        delete this.fallbackStorage[chartKey];
        console.log(`🗑️ Deleted size chart from memory for ${chartKey}`);
      }
      return existed;
    }
  }
}

export default DatabaseStorage;