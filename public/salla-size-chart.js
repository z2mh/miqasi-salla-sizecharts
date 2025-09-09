/**
 * Salla Native Size Chart Component
 * Uses Salla's web components and product data
 */

// Register custom Salla component for size charts
if (typeof window !== 'undefined' && window.salla) {
  
  class SallaSizeChart extends HTMLElement {
    constructor() {
      super();
      this.apiBase = 'https://trynashr.com/api'; // Use main domain to avoid CORS
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

        // Loading size chart for product

        // Check for size chart data
        const response = await fetch(`${this.apiBase}/chart-data?store_id=${storeId}&product_id=${productId}`);
        const data = await response.json();

        loading.style.display = 'none';

        if (data.success && data.data) {
          // Size chart data received successfully
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
        background: transparent;
        color: #000000;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 700;
        font-style: italic;
        cursor: pointer;
        width: auto;
        max-width: none;
        transition: all 0.2s ease;
        margin: 10px 0;
        text-decoration: underline;
        text-underline-offset: 2px;
        box-shadow: none;
      `;
      
      // Add hover effect
      button.addEventListener('mouseenter', () => {
        button.style.color = '#333333';
        button.style.textDecoration = 'underline';
        button.style.textDecorationThickness = '2px';
        button.style.transform = 'scale(1.02)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.color = '#000000';
        button.style.textDecoration = 'underline';
        button.style.textDecorationThickness = '1px';
        button.style.transform = 'scale(1)';
      });

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
          background: #ffffff;
          border: 2px solid #000000;
          border-radius: 12px;
          max-width: 750px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.4s ease-out;
          position: relative;
        ">
          <div style="padding: 35px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000000;">
              <div>
                <h2 style="color: #000000; font-size: 28px; margin: 0; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 32px;">📏</span>
                  دليل المقاسات
                </h2>
                <p style="color: #666666; margin: 8px 0 0 44px; font-size: 14px;">اختر المقاس المناسب لك</p>
              </div>
              <button class="miqasi-close-btn" style="
                background: #000000;
                color: white;
                border: 1px solid #000000;
                width: 44px;
                height: 44px;
                border-radius: 6px;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              " onmouseover="this.style.background='#333333'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#000000'; this.style.transform='scale(1)'">
                ✕
              </button>
            </div>
            
            <!-- Tab Navigation -->
            <div style="display: flex; margin-bottom: 25px; border-bottom: 1px solid #e0e0e0;">
              <button class="miqasi-tab-btn active" data-tab="size-chart" style="
                background: #000000; color: white; border: none; padding: 12px 24px; 
                border-radius: 6px 6px 0 0; font-size: 14px; font-weight: 600; cursor: pointer;
                margin-left: 2px; transition: all 0.2s ease;
              ">📏 جدول المقاسات</button>
              <button class="miqasi-tab-btn" data-tab="size-recommendation" style="
                background: #f8f8f8; color: #666666; border: 1px solid #e0e0e0; padding: 12px 24px; 
                border-radius: 6px 6px 0 0; font-size: 14px; font-weight: 600; cursor: pointer;
                border-bottom: none; transition: all 0.2s ease;
              ">🎯 توصية المقاس</button>
            </div>
            
            <!-- Size Chart Tab Content -->
            <div id="size-chart-tab" class="miqasi-tab-content">
            
            <div style="overflow-x: auto; margin-bottom: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background: #000000;">
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
            
            <!-- Measurement Guide Section -->
            <div style="
              background: #f8f8f8;
              padding: 25px;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
              margin-bottom: 20px;
            ">
              <h3 style="color: #000000; font-size: 18px; margin: 0 0 15px 0; font-weight: 600; text-align: center;">
                📏 كيفية أخذ القياسات بدقة
              </h3>
              
              <!-- Image and Instructions Side by Side -->
              <div style="display: flex; gap: 25px; align-items: flex-start; margin: 20px 0;">
                
                <!-- Measurement Image (Left Side) -->
                <div style="flex: 0 0 250px;">
                  <img src="https://trynashr.com/images/measurement-guide.jpg" 
                       alt="دليل القياسات" 
                       style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;"
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                  <div style="display: none; padding: 20px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 8px; color: #666; text-align: center;">
                    📷 صورة دليل القياسات<br>
                    <small>قم بتحميل الصورة في مجلد /images/</small>
                  </div>
                </div>
                
                <!-- Arabic Instructions (Right Side) -->
                <div style="flex: 1; text-align: right; line-height: 1.8;">
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #000000;">الصدر:</strong>
                    <span style="color: #333333;">قس حول أوسع جزء من الصدر تحت الإبطين. تأكد من إبقاء شريط القياس مستوياً عبر الظهر ومريحاً.</span>
                  </div>
                  
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #000000;">الخصر:</strong>
                    <span style="color: #333333;">قس حول الخصر الطبيعي باستخدام شريط قياس.</span>
                  </div>
                  
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #000000;">الطول:</strong>
                    <span style="color: #333333;">قس من أعلى الكتف إلى النقطة المرغوبة للطول.</span>
                  </div>
                </div>
                
              </div>
              
              <!-- Mobile Responsive: Stack vertically on small screens -->
              <style>
                @media (max-width: 600px) {
                  .measurement-container {
                    flex-direction: column !important;
                  }
                  .measurement-image {
                    flex: none !important;
                    max-width: 200px !important;
                    margin: 0 auto !important;
                  }
                }
              </style>
              
              <div style="
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 12px;
                border-radius: 6px;
                margin-top: 15px;
                text-align: center;
              ">
                <strong style="color: #856404;">💡 نصيحة:</strong>
                <span style="color: #856404; font-size: 14px;">
                  جميع القياسات بالسنتيمتر. للحصول على أفضل النتائج، استعن بشخص آخر لأخذ القياسات.
                </span>
              </div>
            </div>
            
            </div> <!-- End Size Chart Tab -->
            
            <!-- Size Recommendation Tab Content -->
            <div id="size-recommendation-tab" class="miqasi-tab-content" style="display: none;">
              
              <div style="
                background: #f8f8f8;
                padding: 25px;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                margin-bottom: 20px;
              ">
                <h3 style="color: #000000; font-size: 18px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
                  🎯 احصل على توصية المقاس المناسب لك
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  
                  <!-- الطول -->
                  <div>
                    <label style="display: block; color: #000000; font-weight: 600; margin-bottom: 8px;">
                      الطول (سم)
                    </label>
                    <input type="number" id="miqasi-height" placeholder="مثال: 175" style="
                      width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px;
                      font-size: 14px; box-sizing: border-box;
                    ">
                  </div>
                  
                  <!-- الوزن -->
                  <div>
                    <label style="display: block; color: #000000; font-weight: 600; margin-bottom: 8px;">
                      الوزن (كغ)
                    </label>
                    <input type="number" id="miqasi-weight" placeholder="مثال: 70" style="
                      width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px;
                      font-size: 14px; box-sizing: border-box;
                    ">
                  </div>
                  
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  
                  <!-- العمر -->
                  <div>
                    <label style="display: block; color: #000000; font-weight: 600; margin-bottom: 8px;">
                      العمر
                    </label>
                    <input type="number" id="miqasi-age" placeholder="مثال: 30" style="
                      width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px;
                      font-size: 14px; box-sizing: border-box;
                    ">
                  </div>
                  
                  <!-- نوع الجسم -->
                  <div>
                    <label style="display: block; color: #000000; font-weight: 600; margin-bottom: 8px;">
                      نوع الجسم
                    </label>
                    <select id="miqasi-body-type" style="
                      width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px;
                      font-size: 14px; box-sizing: border-box; background: white;
                    ">
                      <option value="">اختر نوع الجسم</option>
                      <option value="slim">نحيف</option>
                      <option value="athletic">رياضي</option>
                      <option value="average">متوسط</option>
                      <option value="broad">عريض</option>
                    </select>
                  </div>
                  
                </div>
                
                <!-- زر الحساب -->
                <div style="text-align: center; margin-top: 25px;">
                  <button id="miqasi-calculate-btn" style="
                    background: #000000; color: white; border: none; padding: 15px 40px;
                    border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;
                    transition: all 0.2s ease;
                  " onmouseover="this.style.background='#333333'" onmouseout="this.style.background='#000000'">
                    احسب المقاس المناسب
                  </button>
                </div>
                
                <!-- نتيجة التوصية -->
                <div id="miqasi-recommendation-result" style="
                  display: none; margin-top: 25px; padding: 20px; background: #e8f5e8;
                  border: 1px solid #4caf50; border-radius: 8px; text-align: center;
                ">
                  <h4 style="color: #2e7d32; margin: 0 0 10px 0;">🎉 المقاس المناسب لك:</h4>
                  <div id="miqasi-recommended-size" style="
                    font-size: 24px; font-weight: 700; color: #1b5e20; margin: 10px 0;
                  "></div>
                  <div id="miqasi-size-confidence" style="
                    font-size: 14px; color: #388e3c; margin-top: 10px;
                  "></div>
                </div>
                
              </div>
              
            </div> <!-- End Size Recommendation Tab -->
            
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
      
      // Tab functionality
      const tabButtons = modal.querySelectorAll('.miqasi-tab-btn');
      const tabContents = modal.querySelectorAll('.miqasi-tab-content');
      
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const targetTab = button.getAttribute('data-tab');
          
          // Update button styles
          tabButtons.forEach(btn => {
            if (btn === button) {
              btn.style.background = '#000000';
              btn.style.color = 'white';
              btn.classList.add('active');
            } else {
              btn.style.background = '#f8f8f8';
              btn.style.color = '#666666';
              btn.classList.remove('active');
            }
          });
          
          // Show/hide tab content
          tabContents.forEach(content => {
            if (content.id === targetTab + '-tab') {
              content.style.display = 'block';
            } else {
              content.style.display = 'none';
            }
          });
        });
      });
      
      // Size recommendation calculation
      const calculateBtn = modal.querySelector('#miqasi-calculate-btn');
      if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
          const height = parseFloat(modal.querySelector('#miqasi-height').value);
          const weight = parseFloat(modal.querySelector('#miqasi-weight').value);
          const age = parseInt(modal.querySelector('#miqasi-age').value);
          const bodyType = modal.querySelector('#miqasi-body-type').value;
          
          if (!height || !weight) {
            alert('يرجى إدخال الطول والوزن');
            return;
          }
          
          // Calculate BMI
          const heightM = height / 100;
          const bmi = weight / (heightM * heightM);
          
          // Size recommendation algorithm
          let recommendedSize = '';
          let bmiCategory = '';
          
          if (bmi < 18.5) {
            bmiCategory = 'نقص الوزن';
            recommendedSize = getSizeForBMI('underweight', height, bodyType);
          } else if (bmi < 25) {
            bmiCategory = 'وزن طبيعي';
            recommendedSize = getSizeForBMI('normal', height, bodyType);
          } else if (bmi < 30) {
            bmiCategory = 'زيادة الوزن';
            recommendedSize = getSizeForBMI('overweight', height, bodyType);
          } else {
            bmiCategory = 'سمنة';
            recommendedSize = getSizeForBMI('obese', height, bodyType);
          }
          
          // Show results
          const resultDiv = modal.querySelector('#miqasi-recommendation-result');
          const sizeDiv = modal.querySelector('#miqasi-recommended-size');
          const confidenceDiv = modal.querySelector('#miqasi-size-confidence');
          
          sizeDiv.textContent = recommendedSize;
          confidenceDiv.innerHTML = 'هذه التوصية تعتمد على الطول والوزن ونوع الجسم المدخل';
          
          resultDiv.style.display = 'block';
        });
      }
      
      // Size calculation helper function
      function getSizeForBMI(bmiCategory, height, bodyType) {
        const sizes = Object.keys(chartData.sizes || {}).sort();
        
        if (sizes.length === 0) {
          return 'غير محدد';
        }
        
        let sizeIndex = 0; // Default to smallest size
        
        // Height-based adjustments
        if (height < 160) {
          sizeIndex = 0; // Smaller sizes for shorter people
        } else if (height > 180) {
          sizeIndex = Math.min(sizes.length - 1, 2); // Larger sizes for taller people
        } else {
          sizeIndex = Math.floor(sizes.length / 2); // Middle size for average height
        }
        
        // BMI-based adjustments
        switch (bmiCategory) {
          case 'underweight':
            sizeIndex = Math.max(0, sizeIndex - 1);
            break;
          case 'overweight':
            sizeIndex = Math.min(sizes.length - 1, sizeIndex + 1);
            break;
          case 'obese':
            sizeIndex = Math.min(sizes.length - 1, sizeIndex + 2);
            break;
        }
        
        // Body type adjustments
        switch (bodyType) {
          case 'slim':
            sizeIndex = Math.max(0, sizeIndex - 1);
            break;
          case 'broad':
            sizeIndex = Math.min(sizes.length - 1, sizeIndex + 1);
            break;
          case 'athletic':
            sizeIndex = Math.min(sizes.length - 1, sizeIndex + 1);
            break;
        }
        
        return sizes[sizeIndex] || sizes[0];
      }

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