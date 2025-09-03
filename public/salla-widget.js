/**
 * Miqasi Size Guide Widget - Salla Partner App
 * Integrates with Salla stores through the Partners App system
 */

(function() {
    'use strict';

    // Configuration from Salla app settings
    window.MiqasiSallaConfig = window.MiqasiSallaConfig || {
        apiUrl: window.sallaAppConfig?.apiUrl || 'http://localhost:8082',
        merchantId: window.sallaAppConfig?.merchantId || null,
        language: document.documentElement.lang || 'ar',
        enabled: window.sallaAppConfig?.enabled !== false,
        buttonText: {
            ar: '📏 دليل المقاسات',
            en: '📏 Size Guide'
        },
        debug: window.sallaAppConfig?.debug || false
    };

    class SallaSizeWidget {
        constructor(config = {}) {
            this.config = { ...window.MiqasiSallaConfig, ...config };
            this.productInfo = null;
            this.sizeChart = null;
            this.isInitialized = false;

            this.log('🚀 Initializing Salla Size Widget');
            
            // Only initialize if enabled
            if (this.config.enabled) {
                this.init();
            } else {
                this.log('ℹ️ Widget is disabled in app settings');
            }
        }

        log(message, ...args) {
            if (this.config.debug) {
                console.log(`[Miqasi Salla] ${message}`, ...args);
            }
        }

        async init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                this.initialize();
            }
        }

        async initialize() {
            this.log('🔍 Starting Salla widget initialization...');

            // 1. Detect if we're on a product page
            if (!this.isSallaProductPage()) {
                this.log('ℹ️ Not a Salla product page, skipping initialization');
                return;
            }

            // 2. Extract product information from Salla
            this.productInfo = this.extractSallaProductInfo();
            if (!this.productInfo) {
                this.log('❌ Could not extract Salla product information');
                return;
            }

            this.log('✅ Detected Salla product:', this.productInfo);

            // 3. Get merchant ID from Salla store data
            if (!this.config.merchantId) {
                this.config.merchantId = this.getSallaMerchantId();
            }

            if (!this.config.merchantId) {
                this.log('❌ No Salla merchant ID found');
                return;
            }

            this.log('✅ Using merchant ID:', this.config.merchantId);

            // 4. Check if size chart exists for this product
            const hasChart = await this.checkSizeChart();
            if (!hasChart) {
                this.log('ℹ️ No size chart found for product:', this.productInfo.id);
                return;
            }

            // 5. Create and inject the widget
            this.createSallaWidget();
            this.isInitialized = true;
            this.log('✅ Salla widget initialized successfully');

            // 6. Track analytics
            this.trackWidgetLoad();
        }

        /**
         * Check if current page is a Salla product page
         */
        isSallaProductPage() {
            // Check for Salla-specific indicators
            const indicators = [
                // URL pattern
                () => window.location.pathname.includes('/product/'),
                
                // Salla-specific elements
                () => document.querySelector('.product-entry'),
                () => document.querySelector('[data-product-id]'),
                () => document.querySelector('.s-product-card-vertical'),
                
                // Salla global objects
                () => typeof salla !== 'undefined',
                () => typeof window.sallaAppConfig !== 'undefined',
                
                // Meta tags
                () => document.querySelector('meta[name="salla:store_id"]'),
                () => document.querySelector('meta[property="product:price:amount"]')
            ];

            return indicators.some(indicator => {
                try {
                    return indicator();
                } catch (error) {
                    return false;
                }
            });
        }

        /**
         * Extract product information from Salla store
         */
        extractSallaProductInfo() {
            let productInfo = null;

            // Method 1: Salla global data
            if (typeof salla !== 'undefined' && salla.config && salla.config.product) {
                productInfo = {
                    id: salla.config.product.id,
                    name: salla.config.product.name,
                    price: salla.config.product.price,
                    currency: salla.config.store?.currency || 'SAR',
                    platform: 'salla'
                };
            }

            // Method 2: DOM attribute extraction
            if (!productInfo) {
                const productElement = document.querySelector('[data-product-id]');
                if (productElement) {
                    productInfo = {
                        id: productElement.getAttribute('data-product-id'),
                        name: this.extractProductName(),
                        price: this.extractProductPrice(),
                        currency: 'SAR',
                        platform: 'salla'
                    };
                }
            }

            // Method 3: URL extraction
            if (!productInfo) {
                const urlMatch = window.location.pathname.match(/\/product\/([^\/\?]+)/);
                if (urlMatch) {
                    productInfo = {
                        id: urlMatch[1],
                        handle: urlMatch[1],
                        name: this.extractProductName(),
                        price: this.extractProductPrice(),
                        currency: 'SAR',
                        platform: 'salla'
                    };
                }
            }

            // Method 4: Meta tags
            if (!productInfo) {
                const productMeta = document.querySelector('meta[property="product:retailer_item_id"]') ||
                                  document.querySelector('meta[name="product-id"]');
                if (productMeta) {
                    productInfo = {
                        id: productMeta.getAttribute('content'),
                        name: this.extractProductName(),
                        price: this.extractProductPrice(),
                        currency: 'SAR',
                        platform: 'salla'
                    };
                }
            }

            return productInfo;
        }

        /**
         * Extract product name from Salla page
         */
        extractProductName() {
            const selectors = [
                '.product-entry h1',
                '.product-title',
                '.s-product-card-vertical h3',
                'h1[itemprop="name"]',
                '.breadcrumb li:last-child',
                'h1'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }

            return document.title.split(' - ')[0] || 'منتج';
        }

        /**
         * Extract product price from Salla page
         */
        extractProductPrice() {
            const selectors = [
                '.product-entry .price',
                '.s-price',
                '[data-price]',
                '.price .amount',
                '.money',
                '[itemprop="price"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const priceText = element.getAttribute('data-price') || element.textContent;
                    const price = priceText.match(/[\d,\.]+/);
                    if (price) {
                        return price[0];
                    }
                }
            }

            return null;
        }

        /**
         * Get Salla merchant ID
         */
        getSallaMerchantId() {
            // Method 1: Salla global config
            if (typeof salla !== 'undefined' && salla.config && salla.config.store) {
                return salla.config.store.id;
            }

            // Method 2: Meta tag
            const storeMeta = document.querySelector('meta[name="salla:store_id"]');
            if (storeMeta) {
                return storeMeta.getAttribute('content');
            }

            // Method 3: App config
            if (window.sallaAppConfig && window.sallaAppConfig.merchantId) {
                return window.sallaAppConfig.merchantId;
            }

            // Method 4: From URL subdomain (store-name.salla.sa)
            const subdomain = window.location.hostname.split('.')[0];
            if (window.location.hostname.includes('.salla.sa')) {
                return subdomain;
            }

            return null;
        }

        /**
         * Check if size chart exists for this product
         */
        async checkSizeChart() {
            try {
                const response = await fetch(
                    `${this.config.apiUrl}/api/chart-exists/${this.config.merchantId}/${this.productInfo.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.getSallaAccessToken()}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.exists) {
                        this.sizeChart = data.chart;
                        return true;
                    }
                }
            } catch (error) {
                this.log('Error checking size chart:', error);
            }

            return false;
        }

        /**
         * Get Salla access token for API calls
         */
        getSallaAccessToken() {
            // In a real Salla app, this would be provided by the app installation
            return window.sallaAppConfig?.accessToken || null;
        }

        /**
         * Create and inject the Salla-specific widget
         */
        createSallaWidget() {
            // Find Salla-specific insertion point
            const insertLocation = this.findSallaInsertLocation();
            if (!insertLocation) {
                this.log('❌ Could not find suitable location for Salla widget');
                return;
            }

            // Create the button with Salla styling
            this.createSallaButton(insertLocation);
            
            // Create the modal
            this.createSallaModal();
            
            // Attach events
            this.attachSallaEvents();

            this.log('✅ Salla widget created and injected');
        }

        /**
         * Find the best location to insert in Salla theme
         */
        findSallaInsertLocation() {
            const sallaLocationStrategies = [
                // Salla-specific selectors
                () => document.querySelector('.product-form'),
                () => document.querySelector('.add-to-cart-form'),
                () => document.querySelector('.product-entry .btn-container'),
                () => document.querySelector('[data-add-to-cart]')?.parentNode,
                () => document.querySelector('.s-button-primary')?.parentNode,
                
                // Generic fallbacks
                () => document.querySelector('.product-actions'),
                () => document.querySelector('.btn-addtocart')?.parentNode,
                
                // Create container after price
                () => {
                    const priceEl = document.querySelector('.product-entry .price, .s-price');
                    if (priceEl) {
                        const container = document.createElement('div');
                        container.className = 'miqasi-salla-container';
                        container.style.cssText = 'margin: 15px 0;';
                        priceEl.parentNode.insertBefore(container, priceEl.nextSibling);
                        return container;
                    }
                    return null;
                }
            ];

            for (const strategy of sallaLocationStrategies) {
                try {
                    const location = strategy();
                    if (location) {
                        this.log('✅ Found Salla insert location:', location);
                        return location;
                    }
                } catch (error) {
                    this.log('⚠️ Salla location strategy failed:', error);
                }
            }

            return null;
        }

        /**
         * Create button with Salla design system styling
         */
        createSallaButton(container) {
            const button = document.createElement('button');
            button.id = 'miqasi-salla-size-btn';
            button.type = 'button';
            button.className = 'btn miqasi-size-guide-btn';
            button.innerHTML = `
                <span class="miqasi-btn-icon">📏</span>
                <span class="miqasi-btn-text">${this.config.buttonText[this.config.language]}</span>
            `;
            
            // Salla-inspired styling
            button.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
                border: none !important;
                padding: 12px 20px !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                margin: 10px 0 !important;
                width: 100% !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 4px 15px 0 rgba(102, 126, 234, 0.3) !important;
                font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 8px !important;
            `;

            // Hover effects
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) !important';
                button.style.boxShadow = '0 6px 20px 0 rgba(102, 126, 234, 0.4) !important';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) !important';
                button.style.boxShadow = '0 4px 15px 0 rgba(102, 126, 234, 0.3) !important';
            });

            container.appendChild(button);
        }

        /**
         * Create Salla-styled modal
         */
        createSallaModal() {
            const modal = document.createElement('div');
            modal.id = 'miqasi-salla-modal';
            modal.innerHTML = `
                <div class="miqasi-salla-overlay">
                    <div class="miqasi-salla-content">
                        <div class="miqasi-salla-header">
                            <h3>
                                <span class="miqasi-header-icon">📏</span>
                                ${this.config.language === 'ar' ? 'دليل المقاسات' : 'Size Guide'}
                            </h3>
                            <button class="miqasi-salla-close">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="miqasi-salla-tabs">
                            <button class="miqasi-salla-tab active" data-tab="chart">
                                <span class="miqasi-tab-icon">📊</span>
                                ${this.config.language === 'ar' ? 'جدول المقاسات' : 'Size Chart'}
                            </button>
                            <button class="miqasi-salla-tab" data-tab="recommendation">
                                <span class="miqasi-tab-icon">🎯</span>
                                ${this.config.language === 'ar' ? 'توصية ذكية' : 'Smart Recommendation'}
                            </button>
                        </div>

                        <div class="miqasi-salla-tab-content">
                            <div id="miqasi-chart-tab" class="miqasi-salla-pane active">
                                ${this.generateSallaSizeChartHTML()}
                            </div>
                            
                            <div id="miqasi-recommendation-tab" class="miqasi-salla-pane">
                                ${this.generateSallaRecommendationHTML()}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add Salla-specific styles
            this.addSallaModalStyles();
            
            document.body.appendChild(modal);
        }

        generateSallaSizeChartHTML() {
            if (!this.sizeChart || !this.sizeChart.rows) {
                return `<p class="miqasi-no-chart">${this.config.language === 'ar' ? 'جدول المقاسات غير متوفر' : 'Size chart not available'}</p>`;
            }

            const headers = this.config.language === 'ar' ? 
                ['المقاس', 'الصدر', 'الخصر', 'الطول'] : 
                ['Size', 'Chest', 'Waist', 'Length'];
            const unit = this.sizeChart.unit || 'cm';

            let tableHTML = `
                <div class="miqasi-chart-container">
                    <table class="miqasi-salla-table">
                        <thead>
                            <tr>
                                ${headers.map(header => `<th>${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
            `;

            this.sizeChart.rows.forEach((row, index) => {
                tableHTML += `
                    <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
                        <td class="size-cell"><strong>${row.size}</strong></td>
                        <td>${row.chest || '-'} ${row.chest ? unit : ''}</td>
                        <td>${row.waist || '-'} ${row.waist ? unit : ''}</td>
                        <td>${row.length || '-'} ${row.length ? unit : ''}</td>
                    </tr>
                `;
            });

            tableHTML += `
                        </tbody>
                    </table>
                    <div class="miqasi-chart-note">
                        <span class="miqasi-note-icon">ℹ️</span>
                        ${this.config.language === 'ar' ? 
                            `جميع المقاسات بالـ ${unit === 'cm' ? 'سنتيمتر' : 'إنش'}` :
                            `All measurements in ${unit === 'cm' ? 'centimeters' : 'inches'}`
                        }
                    </div>
                </div>
            `;

            return tableHTML;
        }

        generateSallaRecommendationHTML() {
            const isArabic = this.config.language === 'ar';
            
            return `
                <div class="miqasi-recommendation-container">
                    <div class="miqasi-recommendation-intro">
                        <span class="miqasi-intro-icon">🎯</span>
                        <h4>${isArabic ? 'احصل على توصية ذكية للمقاس' : 'Get Smart Size Recommendation'}</h4>
                        <p>${isArabic ? 'أدخل طولك ووزنك للحصول على المقاس الأنسب لك' : 'Enter your height and weight to get the perfect size for you'}</p>
                    </div>
                    
                    <form id="miqasi-salla-form" class="miqasi-recommendation-form">
                        <div class="miqasi-form-row">
                            <div class="miqasi-form-group">
                                <label class="miqasi-salla-label">
                                    <span class="miqasi-label-icon">📏</span>
                                    ${isArabic ? 'الطول (سم)' : 'Height (cm)'}
                                </label>
                                <input type="number" class="miqasi-salla-input" id="miqasi-salla-height" 
                                       placeholder="${isArabic ? '170' : '170'}" min="100" max="250" required>
                            </div>
                            
                            <div class="miqasi-form-group">
                                <label class="miqasi-salla-label">
                                    <span class="miqasi-label-icon">⚖️</span>
                                    ${isArabic ? 'الوزن (كيلو)' : 'Weight (kg)'}
                                </label>
                                <input type="number" class="miqasi-salla-input" id="miqasi-salla-weight" 
                                       placeholder="${isArabic ? '70' : '70'}" min="30" max="200" required>
                            </div>
                        </div>
                        
                        <div class="miqasi-form-group">
                            <label class="miqasi-salla-label">
                                <span class="miqasi-label-icon">👕</span>
                                ${isArabic ? 'تفضيل الارتداء' : 'Fit Preference'}
                            </label>
                            <select class="miqasi-salla-select" id="miqasi-salla-fit">
                                <option value="regular">${isArabic ? 'عادي (مريح)' : 'Regular (Comfortable)'}</option>
                                <option value="tight">${isArabic ? 'ضيق (محكم)' : 'Tight (Fitted)'}</option>
                                <option value="loose">${isArabic ? 'واسع (فضفاض)' : 'Loose (Relaxed)'}</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="miqasi-salla-recommend-btn">
                            <span class="miqasi-btn-icon">🎯</span>
                            <span>${isArabic ? 'احصل على التوصية' : 'Get Recommendation'}</span>
                        </button>
                        
                        <div id="miqasi-salla-result" style="display: none;"></div>
                    </form>
                </div>
            `;
        }

        addSallaModalStyles() {
            if (document.getElementById('miqasi-salla-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'miqasi-salla-styles';
            styles.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
                
                #miqasi-salla-modal {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 999999 !important;
                    display: none !important;
                    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                }
                
                .miqasi-salla-overlay {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)), rgba(0, 0, 0, 0.7) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 20px !important;
                    backdrop-filter: blur(5px) !important;
                }
                
                .miqasi-salla-content {
                    background: white !important;
                    border-radius: 20px !important;
                    max-width: 650px !important;
                    width: 100% !important;
                    max-height: 85vh !important;
                    overflow-y: auto !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    animation: miqasi-salla-enter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                }
                
                @keyframes miqasi-salla-enter {
                    from { opacity: 0; transform: scale(0.8) translateY(-40px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                .miqasi-salla-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 25px 30px !important;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    border-radius: 20px 20px 0 0 !important;
                }
                
                .miqasi-salla-header h3 {
                    margin: 0 !important;
                    font-size: 22px !important;
                    font-weight: 700 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                }
                
                .miqasi-header-icon {
                    font-size: 24px !important;
                }
                
                .miqasi-salla-close {
                    background: rgba(255, 255, 255, 0.2) !important;
                    border: none !important;
                    color: white !important;
                    cursor: pointer !important;
                    padding: 8px !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .miqasi-salla-close:hover {
                    background: rgba(255, 255, 255, 0.3) !important;
                    transform: rotate(90deg) !important;
                }
                
                .miqasi-salla-tabs {
                    display: flex !important;
                    background: #f8f9ff !important;
                    border-bottom: 1px solid #e5e7eb !important;
                }
                
                .miqasi-salla-tab {
                    flex: 1 !important;
                    padding: 18px 20px !important;
                    background: none !important;
                    border: none !important;
                    font-size: 15px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    color: #6b7280 !important;
                    border-bottom: 3px solid transparent !important;
                    transition: all 0.3s ease !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    font-family: 'Cairo', sans-serif !important;
                }
                
                .miqasi-salla-tab:hover {
                    color: #667eea !important;
                    background: rgba(102, 126, 234, 0.05) !important;
                }
                
                .miqasi-salla-tab.active {
                    color: #667eea !important;
                    border-bottom-color: #667eea !important;
                    background: white !important;
                }
                
                .miqasi-tab-icon {
                    font-size: 18px !important;
                }
                
                .miqasi-salla-tab-content {
                    padding: 30px !important;
                }
                
                .miqasi-salla-pane {
                    display: none !important;
                }
                
                .miqasi-salla-pane.active {
                    display: block !important;
                    animation: miqasi-fade-in 0.3s ease-in !important;
                }
                
                @keyframes miqasi-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .miqasi-salla-table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-bottom: 20px !important;
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                }
                
                .miqasi-salla-table th {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    padding: 16px 12px !important;
                    text-align: center !important;
                    font-weight: 700 !important;
                    font-size: 14px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                }
                
                .miqasi-salla-table td {
                    padding: 14px 12px !important;
                    text-align: center !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    font-weight: 500 !important;
                    transition: background-color 0.2s ease !important;
                }
                
                .miqasi-salla-table tr:hover td {
                    background: #f8f9ff !important;
                }
                
                .miqasi-salla-table tr.even td {
                    background: #fafbff !important;
                }
                
                .size-cell {
                    background: linear-gradient(135deg, #667eea20, #764ba220) !important;
                    font-weight: 700 !important;
                    color: #667eea !important;
                }
                
                .miqasi-chart-note {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    padding: 12px !important;
                    background: #e0e7ff !important;
                    border-radius: 8px !important;
                    color: #3730a3 !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                }
                
                .miqasi-recommendation-intro {
                    text-align: center !important;
                    margin-bottom: 30px !important;
                    padding: 20px !important;
                    background: linear-gradient(135deg, #667eea10, #764ba210) !important;
                    border-radius: 12px !important;
                }
                
                .miqasi-intro-icon {
                    font-size: 40px !important;
                    display: block !important;
                    margin-bottom: 10px !important;
                }
                
                .miqasi-recommendation-intro h4 {
                    margin: 10px 0 !important;
                    color: #1f2937 !important;
                    font-size: 20px !important;
                    font-weight: 700 !important;
                }
                
                .miqasi-recommendation-intro p {
                    color: #6b7280 !important;
                    margin: 0 !important;
                    line-height: 1.6 !important;
                }
                
                .miqasi-form-row {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 20px !important;
                    margin-bottom: 20px !important;
                }
                
                .miqasi-form-group {
                    margin-bottom: 20px !important;
                }
                
                .miqasi-salla-label {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    margin-bottom: 8px !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    font-size: 14px !important;
                }
                
                .miqasi-label-icon {
                    font-size: 16px !important;
                }
                
                .miqasi-salla-input, .miqasi-salla-select {
                    width: 100% !important;
                    padding: 14px 16px !important;
                    border: 2px solid #e5e7eb !important;
                    border-radius: 12px !important;
                    font-size: 16px !important;
                    transition: all 0.3s ease !important;
                    box-sizing: border-box !important;
                    font-family: 'Cairo', sans-serif !important;
                    background: white !important;
                }
                
                .miqasi-salla-input:focus, .miqasi-salla-select:focus {
                    outline: none !important;
                    border-color: #667eea !important;
                    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
                    transform: translateY(-1px) !important;
                }
                
                .miqasi-salla-recommend-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    border: none !important;
                    padding: 16px 24px !important;
                    border-radius: 12px !important;
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 10px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    box-shadow: 0 4px 15px 0 rgba(102, 126, 234, 0.4) !important;
                }
                
                .miqasi-salla-recommend-btn:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.6) !important;
                }
                
                .miqasi-salla-recommend-btn:disabled {
                    background: #9ca3af !important;
                    cursor: not-allowed !important;
                    transform: none !important;
                    box-shadow: none !important;
                }
                
                .miqasi-salla-result {
                    margin-top: 25px !important;
                    padding: 20px !important;
                    border-radius: 16px !important;
                    background: linear-gradient(135deg, #10b981, #059669) !important;
                    color: white !important;
                    text-align: center !important;
                    animation: miqasi-result-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                }
                
                @keyframes miqasi-result-appear {
                    from { opacity: 0; transform: scale(0.8) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                .miqasi-recommended-size {
                    font-size: 32px !important;
                    font-weight: 900 !important;
                    margin-bottom: 10px !important;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                }
                
                .miqasi-confidence {
                    font-size: 18px !important;
                    font-weight: 600 !important;
                    margin-bottom: 15px !important;
                    opacity: 0.9 !important;
                }
                
                @media (max-width: 640px) {
                    .miqasi-salla-overlay {
                        padding: 10px !important;
                    }
                    
                    .miqasi-salla-content {
                        max-height: 95vh !important;
                        border-radius: 16px !important;
                    }
                    
                    .miqasi-salla-header {
                        padding: 20px !important;
                        border-radius: 16px 16px 0 0 !important;
                    }
                    
                    .miqasi-salla-tab-content {
                        padding: 20px !important;
                    }
                    
                    .miqasi-form-row {
                        grid-template-columns: 1fr !important;
                        gap: 15px !important;
                    }
                    
                    .miqasi-salla-table th,
                    .miqasi-salla-table td {
                        padding: 10px 6px !important;
                        font-size: 13px !important;
                    }
                }
            `;
            
            document.head.appendChild(styles);
        }

        /**
         * Attach Salla-specific event listeners
         */
        attachSallaEvents() {
            // Open modal
            document.getElementById('miqasi-salla-size-btn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openSallaModal();
                this.trackWidgetClick();
            });

            // Close modal
            document.querySelector('.miqasi-salla-close').addEventListener('click', () => {
                this.closeSallaModal();
            });

            // Close on overlay click
            document.querySelector('.miqasi-salla-overlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeSallaModal();
                }
            });

            // Tab switching
            document.querySelectorAll('.miqasi-salla-tab').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabId = e.target.closest('.miqasi-salla-tab').getAttribute('data-tab');
                    this.switchSallaTab(tabId);
                    this.trackTabSwitch(tabId);
                });
            });

            // Recommendation form
            document.getElementById('miqasi-salla-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.getSallaRecommendation();
            });

            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && document.getElementById('miqasi-salla-modal').style.display === 'block') {
                    this.closeSallaModal();
                }
            });
        }

        openSallaModal() {
            document.getElementById('miqasi-salla-modal').style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        closeSallaModal() {
            document.getElementById('miqasi-salla-modal').style.display = 'none';
            document.body.style.overflow = '';
        }

        switchSallaTab(tabId) {
            // Update tab buttons
            document.querySelectorAll('.miqasi-salla-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

            // Update tab content
            document.querySelectorAll('.miqasi-salla-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            document.getElementById(`miqasi-${tabId}-tab`).classList.add('active');
        }

        async getSallaRecommendation() {
            const height = document.getElementById('miqasi-salla-height').value;
            const weight = document.getElementById('miqasi-salla-weight').value;
            const fitPreference = document.getElementById('miqasi-salla-fit').value;
            const submitBtn = document.querySelector('.miqasi-salla-recommend-btn');
            const resultDiv = document.getElementById('miqasi-salla-result');
            const isArabic = this.config.language === 'ar';

            if (!height || !weight) {
                alert(isArabic ? 'يرجى إدخال الطول والوزن' : 'Please enter height and weight');
                return;
            }

            // Show loading
            submitBtn.disabled = true;
            const originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span>
                <span>${isArabic ? 'جارٍ الحساب...' : 'Calculating...'}</span>
            `;

            try {
                const response = await fetch(`${this.config.apiUrl}/api/recommend`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getSallaAccessToken()}`
                    },
                    body: JSON.stringify({
                        merchant_id: this.config.merchantId,
                        product_id: this.productInfo.id,
                        height: parseFloat(height),
                        weight: parseFloat(weight),
                        fit_preference: fitPreference
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.displaySallaRecommendation(data.recommendation);
                    this.trackRecommendation(data.recommendation);
                } else {
                    throw new Error(data.error || 'Failed to get recommendation');
                }
            } catch (error) {
                this.log('Error getting recommendation:', error);
                resultDiv.innerHTML = `
                    <div style="background: #fee2e2; color: #dc2626; padding: 16px; border-radius: 8px; text-align: center;">
                        ❌ ${isArabic ? 'حدث خطأ في الحصول على التوصية' : 'Error getting recommendation'}
                    </div>
                `;
                resultDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }
        }

        displaySallaRecommendation(recommendation) {
            const resultDiv = document.getElementById('miqasi-salla-result');
            const isArabic = this.config.language === 'ar';
            
            resultDiv.className = 'miqasi-salla-result';
            resultDiv.innerHTML = `
                <div class="miqasi-recommended-size">
                    ${recommendation.recommended_size}
                </div>
                <div class="miqasi-confidence">
                    ${isArabic ? 'دقة التوصية:' : 'Confidence:'} ${recommendation.confidence}%
                </div>
                <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9; line-height: 1.5;">
                    ${recommendation.explanation}
                </p>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <small style="opacity: 0.8;">
                        🎯 ${isArabic ? 'توصية ذكية مبنية على القياسات' : 'Smart recommendation based on measurements'}
                    </small>
                </div>
            `;
            
            resultDiv.style.display = 'block';
        }

        // Analytics tracking methods
        trackWidgetLoad() {
            this.log('📊 Widget loaded for product:', this.productInfo.id);
            // Integration with Salla analytics or your own tracking
        }

        trackWidgetClick() {
            this.log('📊 Widget clicked for product:', this.productInfo.id);
            // Track widget engagement
        }

        trackTabSwitch(tabId) {
            this.log('📊 Tab switched to:', tabId);
            // Track which tab users prefer
        }

        trackRecommendation(recommendation) {
            this.log('📊 Recommendation generated:', recommendation.recommended_size);
            // Track recommendation accuracy and usage
        }
    }

    // Initialize when Salla app config is available
    function initializeSallaWidget() {
        if (window.sallaAppConfig || typeof salla !== 'undefined') {
            window.miqasiSallaWidget = new SallaSizeWidget();
        } else {
            // Retry after a short delay
            setTimeout(initializeSallaWidget, 500);
        }
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSallaWidget);
    } else {
        initializeSallaWidget();
    }

    // Expose for manual initialization
    window.MiqasiSallaSizeWidget = SallaSizeWidget;

    // Add spinning animation
    const spinKeyframes = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    const style = document.createElement('style');
    style.textContent = spinKeyframes;
    document.head.appendChild(style);

})();