/**
 * Salla Native Size Chart Component
 * Uses Salla's web components and product data
 */

// Register custom Salla component for size charts
if (typeof window !== 'undefined' && window.salla) {
  
  class SallaSizeChart extends HTMLElement {
    constructor() {
      super();
      this.apiBase = 'https://app.trynashr.com/api';
    }

    connectedCallback() {
      this.render();
      this.loadSizeChart();
    }

    render() {
      this.innerHTML = `
        <div id="miqasi-size-chart-container" style="margin: 15px 0;">
          <div id="miqasi-loading" style="display: none; text-align: center; padding: 10px; color: #666;">
            جاري تحميل دليل المقاسات...
          </div>
          <div id="miqasi-size-chart-content"></div>
        </div>
      `;
    }

    async loadSizeChart() {
      const loading = this.querySelector('#miqasi-loading');
      const content = this.querySelector('#miqasi-size-chart-content');
      
      try {
        loading.style.display = 'block';

        // Get product ID from Salla's product object
        const productId = this.getProductId();
        const storeId = this.getStoreId();

        if (!productId) {
          loading.style.display = 'none';
          return;
        }

        console.log('Miqasi: Loading size chart for product:', productId);

        // Check for size chart data
        const response = await fetch(`${this.apiBase}/chart-data?store_id=${storeId}&product_id=${productId}`);
        const data = await response.json();

        loading.style.display = 'none';

        if (data.success && data.data) {
          this.renderSizeChartButton(data.data);
        } else {
          console.log('Miqasi: No size chart found for this product');
        }

      } catch (error) {
        loading.style.display = 'none';
        console.error('Miqasi: Error loading size chart:', error);
      }
    }

    getProductId() {
      console.log('Miqasi: Detecting product ID from URL:', window.location.pathname);
      
      // Method 1: From URL pattern /p123456 at the end
      const urlMatch = window.location.pathname.match(/\/p(\d+)$/);
      if (urlMatch) {
        console.log('Miqasi: Product ID found in URL:', urlMatch[1]);
        return urlMatch[1];
      }

      // Method 2: From Salla's global product object
      if (window.salla && window.salla.product && window.salla.product.id) {
        console.log('Miqasi: Product ID found in Salla object:', window.salla.product.id);
        return window.salla.product.id.toString();
      }

      // Method 3: From element attribute
      const productEl = document.querySelector('[data-product-id]');
      if (productEl) {
        console.log('Miqasi: Product ID found in data attribute:', productEl.dataset.productId);
        return productEl.dataset.productId;
      }

      console.log('Miqasi: No product ID found - not a product page');
      return null;
    }

    getStoreId() {
      // Get store ID from hostname or Salla config
      if (window.salla && window.salla.config && window.salla.config.store && window.salla.config.store.id) {
        return window.salla.config.store.id;
      }

      const hostname = window.location.hostname;
      const match = hostname.match(/^([^.]+)\.salla\.sa$/);
      return match ? match[1] : 'demo_store';
    }

    renderSizeChartButton(chartData) {
      const content = this.querySelector('#miqasi-size-chart-content');
      
      const button = document.createElement('button');
      button.className = 'btn btn-outline-primary';
      button.innerHTML = '📏 دليل المقاسات';
      button.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        max-width: 300px;
        transition: transform 0.2s;
        margin: 15px 0;
      `;

      button.addEventListener('click', () => {
        this.openSizeChartModal(chartData);
      });

      content.appendChild(button);
      console.log('Miqasi: Size chart button added');
    }

    openSizeChartModal(chartData) {
      // Create modal using Salla's modal system if available
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      `;

      // Build size table
      let sizeRows = '';
      const sizes = Object.keys(chartData.sizes || {}).sort();
      sizes.forEach(size => {
        const measurements = chartData.sizes[size];
        sizeRows += `
          <tr>
            <td class="text-center font-weight-bold" style="background: #f8f9ff;">${size}</td>
            <td class="text-center">${measurements.chest || '-'} سم</td>
            <td class="text-center">${measurements.waist || '-'} سم</td>
            <td class="text-center">${measurements.length || '-'} سم</td>
          </tr>
        `;
      });

      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content" style="border-radius: 15px;">
            <div class="modal-header border-0" style="padding: 30px 30px 0;">
              <h4 class="modal-title">📏 دليل المقاسات</h4>
              <button type="button" class="close" data-dismiss="modal" style="font-size: 24px;">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body" style="padding: 20px 30px 30px;">
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead style="background: #667eea; color: white;">
                    <tr>
                      <th class="text-center">المقاس</th>
                      <th class="text-center">الصدر</th>
                      <th class="text-center">الخصر</th>
                      <th class="text-center">الطول</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sizeRows}
                  </tbody>
                </table>
              </div>
              <div class="alert alert-info text-center" style="margin-top: 20px;">
                <strong>💡 ملاحظة:</strong> جميع القياسات بالسنتيمتر. للحصول على أفضل النتائج، قم بقياس الجسم مباشرة.
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close handlers
      const closeBtn = modal.querySelector('.close');
      const closeModal = () => {
        document.body.removeChild(modal);
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Close on Escape
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      console.log('Miqasi: Size chart modal opened');
    }
  }

  // Register the custom element
  if (!customElements.get('salla-size-chart')) {
    customElements.define('salla-size-chart', SallaSizeChart);
    console.log('Miqasi: Custom element registered');
  }

  // Auto-initialize on product pages
  function initSizeChart() {
    console.log('Miqasi: Checking if this is a product page...');
    console.log('Miqasi: Current URL:', window.location.pathname);
    
    // Enhanced product page detection
    const urlHasProductId = /\/p(\d+)$/.test(window.location.pathname);
    const sallaHasProduct = !!(window.salla?.product?.id);
    const hasProductElement = !!document.querySelector('[data-product-id]');
    
    console.log('Miqasi: Product page checks:', {
      urlHasProductId,
      sallaHasProduct,
      hasProductElement
    });
    
    const isProductPage = urlHasProductId || sallaHasProduct || hasProductElement;
    
    if (!isProductPage) {
      console.log('Miqasi: Not a product page, skipping initialization');
      return;
    }

    console.log('Miqasi: Product page detected, looking for insertion point...');

    // Check if component already exists
    if (document.querySelector('salla-size-chart')) {
      console.log('Miqasi: Size chart component already exists');
      return;
    }

    // Look for a place to insert the size chart
    const insertionPoints = [
      '.product-price',
      '.price',
      '.product-actions',
      '.add-to-cart',
      'salla-product-options'
    ];

    for (const selector of insertionPoints) {
      const element = document.querySelector(selector);
      if (element) {
        const sizeChart = document.createElement('salla-size-chart');
        element.parentNode.insertBefore(sizeChart, element.nextSibling);
        console.log('Miqasi: Size chart component inserted after', selector);
        return;
      }
    }
    
    console.log('Miqasi: No suitable insertion point found');
  }

  // Initialize when Salla is ready
  if (window.salla && typeof window.salla.onReady === 'function') {
    window.salla.onReady(initSizeChart);
  } else {
    // Fallback initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSizeChart);
    } else {
      initSizeChart();
    }
  }

  // Handle SPA navigation
  if (window.salla && window.salla.event) {
    window.salla.event.on('theme::page::loaded', initSizeChart);
  }

} else {
  console.warn('Miqasi: Salla object not found, component not registered');
}