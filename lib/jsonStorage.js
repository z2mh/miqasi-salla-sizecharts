const fs = require('fs');
const path = require('path');

/**
 * Simple JSON file storage system for multi-tenant size charts
 * Each merchant has their own JSON file: data/merchant-{merchant_id}.json
 */
class JsonStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.ensureDataDir();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log('📁 Created data directory:', this.dataDir);
    }
  }

  /**
   * Get file path for a merchant
   */
  getFilePath(merchantId) {
    return path.join(this.dataDir, `merchant-${merchantId}.json`);
  }

  /**
   * Load merchant's size charts
   */
  loadMerchantCharts(merchantId) {
    try {
      const filePath = this.getFilePath(merchantId);
      if (!fs.existsSync(filePath)) {
        console.log(`📂 No charts file found for merchant ${merchantId}, returning empty`);
        return {};
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const charts = JSON.parse(data);
      console.log(`📊 Loaded ${Object.keys(charts).length} charts for merchant ${merchantId}`);
      return charts;
    } catch (error) {
      console.error(`❌ Error loading charts for merchant ${merchantId}:`, error);
      return {};
    }
  }

  /**
   * Save merchant's size charts
   */
  saveMerchantCharts(merchantId, charts) {
    try {
      const filePath = this.getFilePath(merchantId);
      const data = JSON.stringify(charts, null, 2);
      fs.writeFileSync(filePath, data, 'utf8');
      console.log(`💾 Saved ${Object.keys(charts).length} charts for merchant ${merchantId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving charts for merchant ${merchantId}:`, error);
      return false;
    }
  }

  /**
   * Get size chart for specific product
   */
  getChart(merchantId, productId) {
    const charts = this.loadMerchantCharts(merchantId);
    return charts[productId] || null;
  }

  /**
   * Save size chart for specific product
   */
  saveChart(merchantId, productId, chartData) {
    const charts = this.loadMerchantCharts(merchantId);
    
    charts[productId] = {
      ...chartData,
      updated_at: new Date().toISOString(),
      merchant_id: merchantId,
      product_id: productId
    };

    return this.saveMerchantCharts(merchantId, charts);
  }

  /**
   * Delete size chart for specific product
   */
  deleteChart(merchantId, productId) {
    const charts = this.loadMerchantCharts(merchantId);
    
    if (charts[productId]) {
      delete charts[productId];
      console.log(`🗑️ Deleted chart for merchant ${merchantId}, product ${productId}`);
      return this.saveMerchantCharts(merchantId, charts);
    }
    
    return true; // Already doesn't exist
  }

  /**
   * Check if chart exists for product
   */
  chartExists(merchantId, productId) {
    const chart = this.getChart(merchantId, productId);
    return chart && chart.rows && chart.rows.some(row => row.chest || row.waist || row.length);
  }

  /**
   * Get all merchant's charts with status
   */
  getAllChartsWithStatus(merchantId) {
    const charts = this.loadMerchantCharts(merchantId);
    const result = {};

    for (const [productId, chart] of Object.entries(charts)) {
      result[productId] = {
        exists: chart.rows && chart.rows.some(row => row.chest || row.waist || row.length),
        updated_at: chart.updated_at,
        unit: chart.unit
      };
    }

    return result;
  }

  /**
   * Get file size and chart count for a merchant (for monitoring)
   */
  getMerchantStats(merchantId) {
    try {
      const filePath = this.getFilePath(merchantId);
      if (!fs.existsSync(filePath)) {
        return { charts: 0, fileSize: 0 };
      }

      const stats = fs.statSync(filePath);
      const charts = this.loadMerchantCharts(merchantId);
      
      return {
        charts: Object.keys(charts).length,
        fileSize: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error(`❌ Error getting stats for merchant ${merchantId}:`, error);
      return { charts: 0, fileSize: 0 };
    }
  }
}

module.exports = JsonStorage;