/**
 * Salla Native Size Chart Component
 * Uses Salla's web components and product data
 */

// Register custom Salla component for size charts
if (typeof window !== 'undefined' && window.salla) {
  
  class SallaSizeChart extends HTMLElement {
    constructor() {
      super();
      this.apiBase = 'https://trynashr.com/api';
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
          console.log('Miqasi: Size chart data received:', JSON.stringify(data.data, null, 2));
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
      console.log('Miqasi: Opening modal with chart data:', JSON.stringify(chartData, null, 2));
      console.log('Miqasi: Available sizes:', Object.keys(chartData.sizes || {}));
      
      // Create beautiful modal overlay
      const modal = document.createElement('div');
      modal.className = 'miqasi-modal-overlay';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease-out;
      `;

      // Build size table with enhanced styling
      let sizeRows = '';
      const sizes = Object.keys(chartData.sizes || {}).sort();
      sizes.forEach((size, index) => {
        const measurements = chartData.sizes[size];
        const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
        sizeRows += `
          <tr class="${rowClass}" style="transition: all 0.2s ease;">
            <td style="padding: 15px 12px; text-align: center; font-weight: 700; font-size: 16px; background: linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%); border: 1px solid #e1e8ed; color: #2c3e50;">${size}</td>
            <td style="padding: 15px 12px; text-align: center; font-size: 15px; border: 1px solid #e1e8ed; color: #34495e;">${measurements.chest || '-'} <span style="color: #7f8c8d; font-size: 13px;">سم</span></td>
            <td style="padding: 15px 12px; text-align: center; font-size: 15px; border: 1px solid #e1e8ed; color: #34495e;">${measurements.waist || '-'} <span style="color: #7f8c8d; font-size: 13px;">سم</span></td>
            <td style="padding: 15px 12px; text-align: center; font-size: 15px; border: 1px solid #e1e8ed; color: #34495e;">${measurements.length || '-'} <span style="color: #7f8c8d; font-size: 13px;">سم</span></td>
          </tr>
        `;
      });

      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          max-width: 650px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.4s ease-out;
          position: relative;
        ">
          <div style="padding: 35px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9;">
              <div>
                <h2 style="color: #1e293b; font-size: 28px; margin: 0; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 32px;">📏</span>
                  دليل المقاسات
                </h2>
                <p style="color: #64748b; margin: 8px 0 0 44px; font-size: 14px;">اختر المقاس المناسب لك</p>
              </div>
              <button class="miqasi-close-btn" style="
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                border: none;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
              " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 20px rgba(239, 68, 68, 0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)'">
                ✕
              </button>
            </div>
            
            <div style="overflow-x: auto; margin-bottom: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <th style="padding: 18px 12px; text-align: center; color: white; font-weight: 600; font-size: 16px; border: none;">المقاس</th>
                    <th style="padding: 18px 12px; text-align: center; color: white; font-weight: 600; font-size: 16px; border: none;">الصدر</th>
                    <th style="padding: 18px 12px; text-align: center; color: white; font-weight: 600; font-size: 16px; border: none;">الخصر</th>
                    <th style="padding: 18px 12px; text-align: center; color: white; font-weight: 600; font-size: 16px; border: none;">الطول</th>
                  </tr>
                </thead>
                <tbody>
                  ${sizeRows}
                </tbody>
              </table>
            </div>
            
            <div style="
              background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
              padding: 20px;
              border-radius: 12px;
              border-right: 4px solid #0ea5e9;
              box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
            ">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="font-size: 20px; margin-top: 2px;">💡</span>
                <div>
                  <p style="margin: 0; color: #0c4a6e; font-weight: 600; font-size: 15px; margin-bottom: 4px;">ملاحظة مهمة:</p>
                  <p style="margin: 0; color: #0369a1; font-size: 14px; line-height: 1.6;">
                    جميع القياسات بالسنتيمتر. للحصول على أفضل النتائج، قم بقياس الجسم مباشرة باستخدام شريط القياس.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0; 
              transform: translateY(30px) scale(0.95); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          
          .even-row:hover {
            background: #f8fafc !important;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .odd-row:hover {
            background: #f1f5f9 !important;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        </style>
      `;

      document.body.appendChild(modal);

      // Enhanced close functionality
      const closeBtn = modal.querySelector('.miqasi-close-btn');
      const closeModal = () => {
        modal.style.animation = 'fadeOut 0.2s ease-in';
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        }, 200);
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Enhanced escape key handling
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