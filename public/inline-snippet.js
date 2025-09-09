// Inline App Snippet - No external dependencies
(function() {
  'use strict';
  
  // Skip if Salla not available
  if (typeof window === 'undefined' || !window.salla) {
    return;
  }

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
        const productId = this.getProductId();
        const storeId = this.getStoreId();

        if (!productId) {
          loading.style.display = 'none';
          return;
        }

        const response = await fetch(`${this.apiBase}/chart-data?store_id=${storeId}&product_id=${productId}`);
        const data = await response.json();
        loading.style.display = 'none';

        if (data.success && data.data) {
          this.renderSizeChartButton(data.data);
        }
      } catch (error) {
        loading.style.display = 'none';
      }
    }

    getProductId() {
      const urlMatch = window.location.pathname.match(/\/p(\d+)$/);
      if (urlMatch) return urlMatch[1];
      
      if (window.salla?.product?.id) {
        return window.salla.product.id.toString();
      }
      
      const productEl = document.querySelector('[data-product-id]');
      if (productEl) return productEl.dataset.productId;
      
      return null;
    }

    getStoreId() {
      if (window.salla?.config?.store?.id) {
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
        color: white; border: none; padding: 12px 24px; border-radius: 8px;
        font-size: 16px; font-weight: 600; cursor: pointer; width: 100%;
        max-width: 300px; transition: transform 0.2s; margin: 15px 0;
      `;
      button.addEventListener('click', () => this.openSizeChartModal(chartData));
      content.appendChild(button);
    }

    openSizeChartModal(chartData) {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 999999; display: flex;
        align-items: center; justify-content: center; padding: 20px;
      `;

      let sizeRows = '';
      const sizes = Object.keys(chartData.sizes || {}).sort();
      sizes.forEach(size => {
        const measurements = chartData.sizes[size];
        sizeRows += `
          <tr>
            <td style="padding: 15px 12px; text-align: center; font-weight: 700; background: #f8f9ff; border: 1px solid #ddd;">${size}</td>
            <td style="padding: 15px 12px; text-align: center; border: 1px solid #ddd;">${measurements.chest || '-'} سم</td>
            <td style="padding: 15px 12px; text-align: center; border: 1px solid #ddd;">${measurements.waist || '-'} سم</td>
            <td style="padding: 15px 12px; text-align: center; border: 1px solid #ddd;">${measurements.length || '-'} سم</td>
          </tr>
        `;
      });

      modal.innerHTML = `
        <div style="background: white; border-radius: 15px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
          <div style="padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
              <h3 style="margin: 0; color: #333;">📏 دليل المقاسات</h3>
              <button class="miqasi-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #667eea; color: white;">
                  <th style="padding: 12px; text-align: center;">المقاس</th>
                  <th style="padding: 12px; text-align: center;">الصدر</th>
                  <th style="padding: 12px; text-align: center;">الخصر</th>
                  <th style="padding: 12px; text-align: center;">الطول</th>
                </tr>
              </thead>
              <tbody>${sizeRows}</tbody>
            </table>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const closeModal = () => document.body.removeChild(modal);
      modal.querySelector('.miqasi-close').onclick = closeModal;
      modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }
  }

  // Register custom element
  if (!customElements.get('salla-size-chart')) {
    customElements.define('salla-size-chart', SallaSizeChart);
  }

  // Auto-initialize on product pages
  function initSizeChart() {
    const urlHasProductId = /\/p(\d+)$/.test(window.location.pathname);
    const sallaHasProduct = !!(window.salla?.product?.id);
    
    if (!(urlHasProductId || sallaHasProduct)) return;
    if (document.querySelector('salla-size-chart')) return;

    const insertionPoints = ['.product-price', '.price', '.product-actions', '.add-to-cart'];
    
    for (const selector of insertionPoints) {
      const element = document.querySelector(selector);
      if (element) {
        const sizeChart = document.createElement('salla-size-chart');
        element.parentNode.insertBefore(sizeChart, element.nextSibling);
        return;
      }
    }
  }

  // Initialize when ready
  if (window.salla && typeof window.salla.onReady === 'function') {
    window.salla.onReady(initSizeChart);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSizeChart);
    } else {
      initSizeChart();
    }
  }
})();