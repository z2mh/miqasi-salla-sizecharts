/**
 * Miqasi Universal Size Widget
 * Works with ANY website/store platform (Shopify, Salla, WooCommerce, etc.)
 * Automatically detects product information and displays size guide
 */

(function() {
    'use strict';

    // Configuration - can be overridden
    window.MiqasiConfig = window.MiqasiConfig || {
        apiUrl: 'https://your-app-domain.com', // Your app's domain
        merchantId: null, // Will be detected automatically
        language: 'ar',
        autoDetect: true,
        buttonText: {
            ar: '📏 دليل المقاسات',
            en: '📏 Size Guide'
        },
        debug: false
    };

    class UniversalSizeWidget {
        constructor(config = {}) {
            this.config = { ...window.MiqasiConfig, ...config };
            this.productInfo = null;
            this.sizeChart = null;
            this.isInitialized = false;

            this.log('🚀 Initializing Universal Size Widget');
            this.init();
        }

        log(message, ...args) {
            if (this.config.debug) {
                console.log(`[Miqasi] ${message}`, ...args);
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
            this.log('🔍 Starting initialization...');

            // 1. Auto-detect platform and product info
            this.productInfo = this.detectProduct();
            if (!this.productInfo) {
                this.log('❌ Could not detect product information');
                return;
            }

            this.log('✅ Detected product:', this.productInfo);

            // 2. Get merchant ID from API or config
            if (!this.config.merchantId) {
                this.config.merchantId = await this.detectMerchant();
            }

            if (!this.config.merchantId) {
                this.log('❌ No merchant ID found');
                return;
            }

            // 3. Check if size chart exists
            const hasChart = await this.checkSizeChart();
            if (!hasChart) {
                this.log('ℹ️ No size chart found for this product');
                return;
            }

            // 4. Create and inject the widget
            this.createWidget();
            this.isInitialized = true;
            this.log('✅ Widget initialized successfully');
        }

        /**
         * Auto-detect product information from various platforms
         */
        detectProduct() {
            const detectors = [
                this.detectShopify.bind(this),
                this.detectSalla.bind(this),
                this.detectWooCommerce.bind(this),
                this.detectGeneric.bind(this)
            ];

            for (const detector of detectors) {
                try {
                    const result = detector();
                    if (result) {
                        this.log(`🎯 Detected platform: ${result.platform}`);
                        return result;
                    }
                } catch (error) {
                    this.log(`⚠️ Detector failed:`, error);
                }
            }

            return null;
        }

        /**
         * Shopify product detection
         */
        detectShopify() {
            // Check for Shopify's global objects
            if (typeof Shopify !== 'undefined' && Shopify.routes) {
                const productId = this.extractShopifyProductId();
                if (productId) {
                    return {
                        platform: 'shopify',
                        id: productId,
                        title: this.getProductTitle(),
                        price: this.getProductPrice(),
                        currency: Shopify.currency?.active || 'USD'
                    };
                }
            }

            // Shopify URL pattern detection
            const shopifyMatch = window.location.pathname.match(/\/products\/([^\/]+)/);
            if (shopifyMatch) {
                return {
                    platform: 'shopify',
                    handle: shopifyMatch[1],
                    id: this.extractProductIdFromMeta() || shopifyMatch[1],
                    title: this.getProductTitle(),
                    price: this.getProductPrice(),
                    currency: this.detectCurrency()
                };
            }

            return null;
        }

        extractShopifyProductId() {
            // Try multiple methods to get Shopify product ID
            if (typeof meta !== 'undefined' && meta.product) {
                return meta.product.id;
            }

            if (typeof window.ShopifyAnalytics !== 'undefined' && 
                window.ShopifyAnalytics.meta && 
                window.ShopifyAnalytics.meta.product) {
                return window.ShopifyAnalytics.meta.product.id;
            }

            // Look in JSON-LD
            const jsonLd = document.querySelector('script[type="application/ld+json"]');
            if (jsonLd) {
                try {
                    const data = JSON.parse(jsonLd.textContent);
                    if (data['@type'] === 'Product' && data.productID) {
                        return data.productID;
                    }
                } catch (e) {}
            }

            // Look in meta tags
            const productMeta = document.querySelector('meta[property="product:retailer_item_id"]');
            if (productMeta) {
                return productMeta.getAttribute('content');
            }

            return null;
        }

        /**
         * Salla product detection
         */
        detectSalla() {
            // Salla-specific detection
            if (window.location.hostname.includes('.salla.sa') || 
                window.location.hostname.includes('mystore.sa')) {
                
                const sallaMatch = window.location.pathname.match(/\/product\/([^\/]+)/);
                if (sallaMatch) {
                    return {
                        platform: 'salla',
                        handle: sallaMatch[1],
                        id: this.extractProductIdFromMeta() || sallaMatch[1],
                        title: this.getProductTitle(),
                        price: this.getProductPrice(),
                        currency: 'SAR'
                    };
                }
            }

            return null;
        }

        /**
         * WooCommerce detection
         */
        detectWooCommerce() {
            // WooCommerce indicators
            if (document.body.classList.contains('single-product') ||
                document.querySelector('.woocommerce-product')) {
                
                const productId = document.querySelector('[name="add-to-cart"]')?.value ||
                                document.querySelector('.product')?.id?.replace('product-', '') ||
                                this.extractProductIdFromMeta();

                if (productId) {
                    return {
                        platform: 'woocommerce',
                        id: productId,
                        title: this.getProductTitle(),
                        price: this.getProductPrice(),
                        currency: this.detectCurrency()
                    };
                }
            }

            return null;
        }

        /**
         * Generic product detection fallback
         */
        detectGeneric() {
            // Look for common product page indicators
            const productIndicators = [
                '.product-page',
                '.product-detail',
                '[itemtype*="Product"]',
                '.single-product'
            ];

            const hasProductIndicator = productIndicators.some(selector => 
                document.querySelector(selector)
            );

            if (hasProductIndicator) {
                const productId = this.extractProductIdFromMeta() || 
                                this.extractProductIdFromURL() ||
                                'generic-product';

                return {
                    platform: 'generic',
                    id: productId,
                    title: this.getProductTitle(),
                    price: this.getProductPrice(),
                    currency: this.detectCurrency()
                };
            }

            return null;
        }

        /**
         * Extract product ID from meta tags
         */
        extractProductIdFromMeta() {
            const selectors = [
                'meta[name="product-id"]',
                'meta[property="product:retailer_item_id"]',
                'meta[property="product:id"]',
                'meta[name="shopify-product-id"]',
                'meta[name="wc-product-id"]'
            ];

            for (const selector of selectors) {
                const meta = document.querySelector(selector);
                if (meta) {
                    return meta.getAttribute('content');
                }
            }

            return null;
        }

        /**
         * Extract product ID from URL patterns
         */
        extractProductIdFromURL() {
            const patterns = [
                /\/product\/(\d+)/,
                /\/products\/(\d+)/,
                /product_id=(\d+)/,
                /id=(\d+)/
            ];

            for (const pattern of patterns) {
                const match = window.location.href.match(pattern);
                if (match) {
                    return match[1];
                }
            }

            return null;
        }

        /**
         * Get product title from various selectors
         */
        getProductTitle() {
            const selectors = [
                'h1.product-title',
                'h1.product-name',
                '.product-title',
                '.product-name',
                '.product h1',
                '[itemprop="name"]',
                'h1'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }

            return 'Product';
        }

        /**
         * Get product price from various selectors
         */
        getProductPrice() {
            const selectors = [
                '.price',
                '.product-price',
                '.current-price',
                '[itemprop="price"]',
                '.money',
                '.amount'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const price = element.textContent.match(/[\d,\.]+/);
                    if (price) {
                        return price[0];
                    }
                }
            }

            return null;
        }

        /**
         * Detect currency from page
         */
        detectCurrency() {
            // Look for currency indicators
            const currencyPatterns = [
                /\$(\d+)/g,    // USD
                /€(\d+)/g,     // EUR
                /£(\d+)/g,     // GBP
                /ريال/g,       // SAR
                /درهم/g        // AED
            ];

            const pageText = document.body.textContent;

            if (pageText.includes('ريال') || pageText.includes('SAR')) return 'SAR';
            if (pageText.includes('درهم') || pageText.includes('AED')) return 'AED';
            if (pageText.includes('$') || pageText.includes('USD')) return 'USD';
            if (pageText.includes('€') || pageText.includes('EUR')) return 'EUR';
            if (pageText.includes('£') || pageText.includes('GBP')) return 'GBP';

            return 'USD'; // Default fallback
        }

        /**
         * Detect or get merchant ID
         */
        async detectMerchant() {
            // Try to get from API based on domain
            try {
                const response = await fetch(`${this.config.apiUrl}/api/detect-merchant`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        domain: window.location.hostname,
                        platform: this.productInfo.platform
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.merchantId;
                }
            } catch (error) {
                this.log('⚠️ Could not auto-detect merchant:', error);
            }

            // Fallback: look for data attributes
            const merchantEl = document.querySelector('[data-miqasi-merchant-id]');
            if (merchantEl) {
                return merchantEl.getAttribute('data-miqasi-merchant-id');
            }

            return null;
        }

        /**
         * Check if size chart exists for this product
         */
        async checkSizeChart() {
            try {
                const response = await fetch(
                    `${this.config.apiUrl}/api/chart-exists/${this.config.merchantId}/${this.productInfo.id}`
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
         * Create and inject the widget
         */
        createWidget() {
            // Find the best location to inject the button
            const insertLocation = this.findInsertLocation();
            if (!insertLocation) {
                this.log('❌ Could not find suitable location for widget');
                return;
            }

            // Create the button
            this.createButton(insertLocation);
            
            // Create the modal
            this.createModal();
            
            // Attach events
            this.attachEvents();

            this.log('✅ Widget created and injected');
        }

        /**
         * Find the best location to insert the size guide button
         */
        findInsertLocation() {
            const locationStrategies = [
                // Shopify-specific locations
                () => document.querySelector('.product-form__buttons'),
                () => document.querySelector('.shopify-payment-button'),
                () => document.querySelector('.btn.product-form__cart-submit'),
                
                // Salla-specific locations
                () => document.querySelector('.add-to-cart'),
                () => document.querySelector('.product-actions'),
                
                // WooCommerce locations
                () => document.querySelector('.single_add_to_cart_button')?.parentNode,
                () => document.querySelector('.woocommerce-variation-add-to-cart'),
                
                // Generic locations
                () => document.querySelector('.add-to-cart'),
                () => document.querySelector('.buy-now'),
                () => document.querySelector('[type="submit"]')?.closest('.product-form'),
                () => document.querySelector('.product-price')?.parentNode,
                
                // Last resort - create container after price
                () => {
                    const priceEl = document.querySelector('.price, .product-price, [class*="price"]');
                    if (priceEl) {
                        const container = document.createElement('div');
                        container.className = 'miqasi-widget-container';
                        container.style.cssText = 'margin: 15px 0;';
                        priceEl.parentNode.insertBefore(container, priceEl.nextSibling);
                        return container;
                    }
                    return null;
                }
            ];

            for (const strategy of locationStrategies) {
                try {
                    const location = strategy();
                    if (location) {
                        this.log('✅ Found insert location:', location);
                        return location;
                    }
                } catch (error) {
                    this.log('⚠️ Location strategy failed:', error);
                }
            }

            return null;
        }

        /**
         * Create the size guide button
         */
        createButton(container) {
            const button = document.createElement('button');
            button.id = 'miqasi-universal-size-btn';
            button.type = 'button';
            button.innerHTML = this.config.buttonText[this.config.language];
            
            // Smart styling that adapts to existing buttons
            const existingButton = container.querySelector('button, .btn, input[type="submit"]');
            let buttonStyle = {
                background: '#48bb78',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                margin: '8px 0',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontFamily: 'inherit'
            };

            // Try to match existing button styles
            if (existingButton) {
                const computedStyle = window.getComputedStyle(existingButton);
                buttonStyle = {
                    ...buttonStyle,
                    fontSize: computedStyle.fontSize,
                    fontFamily: computedStyle.fontFamily,
                    borderRadius: computedStyle.borderRadius,
                    padding: computedStyle.padding || buttonStyle.padding,
                    fontWeight: computedStyle.fontWeight || buttonStyle.fontWeight
                };
            }

            // Apply styles
            Object.assign(button.style, buttonStyle);

            // Add hover effects
            button.addEventListener('mouseenter', () => {
                button.style.background = '#38a169';
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.background = buttonStyle.background;
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = buttonStyle.boxShadow;
            });

            container.appendChild(button);
        }

        /**
         * Create the modal popup
         */
        createModal() {
            // Reuse the modal HTML from the original widget
            const modal = document.createElement('div');
            modal.id = 'miqasi-universal-modal';
            modal.innerHTML = `
                <div class="miqasi-modal-overlay">
                    <div class="miqasi-modal-content">
                        <div class="miqasi-modal-header">
                            <h3>${this.config.language === 'ar' ? 'دليل المقاسات' : 'Size Guide'}</h3>
                            <button class="miqasi-close-btn">×</button>
                        </div>
                        
                        <div class="miqasi-tabs">
                            <button class="miqasi-tab-btn active" data-tab="chart">
                                ${this.config.language === 'ar' ? '📏 جدول المقاسات' : '📏 Size Chart'}
                            </button>
                            <button class="miqasi-tab-btn" data-tab="recommendation">
                                ${this.config.language === 'ar' ? '🎯 توصية المقاس' : '🎯 Size Recommendation'}
                            </button>
                        </div>

                        <div class="miqasi-tab-content">
                            <div id="miqasi-chart-tab" class="miqasi-tab-pane active">
                                ${this.generateSizeChartHTML()}
                            </div>
                            
                            <div id="miqasi-recommendation-tab" class="miqasi-tab-pane">
                                ${this.generateRecommendationHTML()}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add styles (same as before but with higher z-index)
            this.addModalStyles();
            
            // Append to body
            document.body.appendChild(modal);
        }

        generateSizeChartHTML() {
            if (!this.sizeChart || !this.sizeChart.rows) {
                return `<p>${this.config.language === 'ar' ? 'جدول المقاسات غير متوفر' : 'Size chart not available'}</p>`;
            }

            const headers = this.config.language === 'ar' ? 
                ['المقاس', 'الصدر', 'الخصر', 'الطول'] : 
                ['Size', 'Chest', 'Waist', 'Length'];
            const unit = this.sizeChart.unit || 'cm';

            let tableHTML = `
                <table class="miqasi-size-chart-table">
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
            `;

            this.sizeChart.rows.forEach(row => {
                tableHTML += `
                    <tr>
                        <td><strong>${row.size}</strong></td>
                        <td>${row.chest || '-'} ${row.chest ? unit : ''}</td>
                        <td>${row.waist || '-'} ${row.waist ? unit : ''}</td>
                        <td>${row.length || '-'} ${row.length ? unit : ''}</td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
                <p style="text-align: center; color: #718096; font-size: 14px;">
                    ${this.config.language === 'ar' ? 
                        `جميع المقاسات بالـ ${unit === 'cm' ? 'سنتيمتر' : 'إنش'}` :
                        `All measurements in ${unit === 'cm' ? 'centimeters' : 'inches'}`
                    }
                </p>
            `;

            return tableHTML;
        }

        generateRecommendationHTML() {
            const isArabic = this.config.language === 'ar';
            
            return `
                <form id="miqasi-recommendation-form">
                    <div class="miqasi-form-group">
                        <label class="miqasi-form-label">${isArabic ? 'الطول (سم)' : 'Height (cm)'}</label>
                        <input type="number" class="miqasi-form-input" id="miqasi-height" 
                               placeholder="${isArabic ? 'مثال: 170' : 'e.g. 170'}" min="100" max="250" required>
                    </div>
                    
                    <div class="miqasi-form-group">
                        <label class="miqasi-form-label">${isArabic ? 'الوزن (كيلو)' : 'Weight (kg)'}</label>
                        <input type="number" class="miqasi-form-input" id="miqasi-weight" 
                               placeholder="${isArabic ? 'مثال: 70' : 'e.g. 70'}" min="30" max="200" required>
                    </div>
                    
                    <div class="miqasi-form-group">
                        <label class="miqasi-form-label">${isArabic ? 'تفضيل الارتداء' : 'Fit Preference'}</label>
                        <select class="miqasi-form-input" id="miqasi-fit-preference">
                            <option value="regular">${isArabic ? 'عادي' : 'Regular'}</option>
                            <option value="tight">${isArabic ? 'ضيق' : 'Tight'}</option>
                            <option value="loose">${isArabic ? 'واسع' : 'Loose'}</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="miqasi-btn">
                        🎯 ${isArabic ? 'احصل على التوصية' : 'Get Recommendation'}
                    </button>
                    
                    <div id="miqasi-recommendation-result" style="display: none;"></div>
                </form>
            `;
        }

        addModalStyles() {
            if (document.getElementById('miqasi-modal-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'miqasi-modal-styles';
            styles.textContent = `
                #miqasi-universal-modal {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 999999 !important;
                    display: none !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                }
                
                #miqasi-universal-modal .miqasi-modal-overlay {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0, 0, 0, 0.6) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 20px !important;
                }
                
                #miqasi-universal-modal .miqasi-modal-content {
                    background: white !important;
                    border-radius: 12px !important;
                    max-width: 600px !important;
                    width: 100% !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    animation: miqasi-modal-enter 0.3s ease-out !important;
                }
                
                @keyframes miqasi-modal-enter {
                    from { opacity: 0; transform: scale(0.9) translateY(-20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                #miqasi-universal-modal .miqasi-modal-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 20px 24px !important;
                    border-bottom: 1px solid #e5e5e5 !important;
                }
                
                #miqasi-universal-modal .miqasi-modal-header h3 {
                    margin: 0 !important;
                    font-size: 20px !important;
                    font-weight: 600 !important;
                    color: #1a202c !important;
                }
                
                #miqasi-universal-modal .miqasi-close-btn {
                    background: none !important;
                    border: none !important;
                    font-size: 24px !important;
                    cursor: pointer !important;
                    color: #718096 !important;
                    padding: 0 !important;
                    width: 32px !important;
                    height: 32px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 6px !important;
                    transition: all 0.2s !important;
                }
                
                #miqasi-universal-modal .miqasi-close-btn:hover {
                    background: #f7fafc !important;
                    color: #2d3748 !important;
                }
                
                #miqasi-universal-modal .miqasi-tabs {
                    display: flex !important;
                    border-bottom: 1px solid #e5e5e5 !important;
                }
                
                #miqasi-universal-modal .miqasi-tab-btn {
                    flex: 1 !important;
                    padding: 16px 20px !important;
                    background: none !important;
                    border: none !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    cursor: pointer !important;
                    color: #718096 !important;
                    border-bottom: 2px solid transparent !important;
                    transition: all 0.2s !important;
                }
                
                #miqasi-universal-modal .miqasi-tab-btn:hover {
                    color: #2d3748 !important;
                    background: #f7fafc !important;
                }
                
                #miqasi-universal-modal .miqasi-tab-btn.active {
                    color: #48bb78 !important;
                    border-bottom-color: #48bb78 !important;
                }
                
                #miqasi-universal-modal .miqasi-tab-content {
                    padding: 24px !important;
                }
                
                #miqasi-universal-modal .miqasi-tab-pane {
                    display: none !important;
                }
                
                #miqasi-universal-modal .miqasi-tab-pane.active {
                    display: block !important;
                }
                
                #miqasi-universal-modal .miqasi-size-chart-table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-bottom: 16px !important;
                }
                
                #miqasi-universal-modal .miqasi-size-chart-table th,
                #miqasi-universal-modal .miqasi-size-chart-table td {
                    padding: 12px !important;
                    text-align: center !important;
                    border: 1px solid #e5e5e5 !important;
                }
                
                #miqasi-universal-modal .miqasi-size-chart-table th {
                    background: #f7fafc !important;
                    font-weight: 600 !important;
                    color: #2d3748 !important;
                }
                
                #miqasi-universal-modal .miqasi-form-group {
                    margin-bottom: 20px !important;
                }
                
                #miqasi-universal-modal .miqasi-form-label {
                    display: block !important;
                    margin-bottom: 8px !important;
                    font-weight: 500 !important;
                    color: #2d3748 !important;
                }
                
                #miqasi-universal-modal .miqasi-form-input {
                    width: 100% !important;
                    padding: 12px !important;
                    border: 1px solid #e5e5e5 !important;
                    border-radius: 8px !important;
                    font-size: 16px !important;
                    transition: border-color 0.2s !important;
                    box-sizing: border-box !important;
                }
                
                #miqasi-universal-modal .miqasi-form-input:focus {
                    outline: none !important;
                    border-color: #48bb78 !important;
                    box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1) !important;
                }
                
                #miqasi-universal-modal .miqasi-btn {
                    background: #48bb78 !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 24px !important;
                    border-radius: 8px !important;
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    transition: background-color 0.2s !important;
                    width: 100% !important;
                }
                
                #miqasi-universal-modal .miqasi-btn:hover {
                    background: #38a169 !important;
                }
                
                #miqasi-universal-modal .miqasi-btn:disabled {
                    background: #cbd5e0 !important;
                    cursor: not-allowed !important;
                }
                
                #miqasi-universal-modal .miqasi-recommendation-result {
                    margin-top: 20px !important;
                    padding: 16px !important;
                    border-radius: 8px !important;
                    background: #f0fff4 !important;
                    border: 1px solid #9ae6b4 !important;
                }
                
                #miqasi-universal-modal .miqasi-recommended-size {
                    font-size: 24px !important;
                    font-weight: bold !important;
                    color: #22543d !important;
                    text-align: center !important;
                    margin-bottom: 8px !important;
                }
                
                #miqasi-universal-modal .miqasi-confidence {
                    text-align: center !important;
                    color: #38a169 !important;
                    font-weight: 500 !important;
                }
                
                @media (max-width: 640px) {
                    #miqasi-universal-modal .miqasi-modal-overlay {
                        padding: 10px !important;
                    }
                    
                    #miqasi-universal-modal .miqasi-modal-content {
                        max-height: 90vh !important;
                    }
                    
                    #miqasi-universal-modal .miqasi-tab-content {
                        padding: 16px !important;
                    }
                }
            `;
            
            document.head.appendChild(styles);
        }

        /**
         * Attach event listeners
         */
        attachEvents() {
            // Open modal
            document.getElementById('miqasi-universal-size-btn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openModal();
            });

            // Close modal
            document.querySelector('#miqasi-universal-modal .miqasi-close-btn').addEventListener('click', () => {
                this.closeModal();
            });

            // Close on overlay click
            document.querySelector('#miqasi-universal-modal .miqasi-modal-overlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal();
                }
            });

            // Tab switching
            document.querySelectorAll('#miqasi-universal-modal .miqasi-tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabId = e.target.getAttribute('data-tab');
                    this.switchTab(tabId);
                });
            });

            // Recommendation form
            document.getElementById('miqasi-recommendation-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.getRecommendation();
            });

            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && document.getElementById('miqasi-universal-modal').style.display === 'block') {
                    this.closeModal();
                }
            });
        }

        openModal() {
            document.getElementById('miqasi-universal-modal').style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        closeModal() {
            document.getElementById('miqasi-universal-modal').style.display = 'none';
            document.body.style.overflow = '';
        }

        switchTab(tabId) {
            // Update tab buttons
            document.querySelectorAll('#miqasi-universal-modal .miqasi-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`#miqasi-universal-modal [data-tab="${tabId}"]`).classList.add('active');

            // Update tab content
            document.querySelectorAll('#miqasi-universal-modal .miqasi-tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            document.getElementById(`miqasi-${tabId}-tab`).classList.add('active');
        }

        async getRecommendation() {
            const height = document.getElementById('miqasi-height').value;
            const weight = document.getElementById('miqasi-weight').value;
            const fitPreference = document.getElementById('miqasi-fit-preference').value;
            const submitBtn = document.querySelector('#miqasi-recommendation-form button[type="submit"]');
            const resultDiv = document.getElementById('miqasi-recommendation-result');
            const isArabic = this.config.language === 'ar';

            if (!height || !weight) {
                alert(isArabic ? 'يرجى إدخال الطول والوزن' : 'Please enter height and weight');
                return;
            }

            // Show loading
            submitBtn.disabled = true;
            submitBtn.textContent = isArabic ? '⏳ جارٍ الحساب...' : '⏳ Calculating...';

            try {
                const response = await fetch(`${this.config.apiUrl}/api/recommend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
                    this.displayRecommendation(data.recommendation);
                } else {
                    throw new Error(data.error || 'Failed to get recommendation');
                }
            } catch (error) {
                this.log('Error getting recommendation:', error);
                resultDiv.innerHTML = `
                    <div style="color: #e53e3e; text-align: center; padding: 16px;">
                        ❌ ${isArabic ? 'حدث خطأ في الحصول على التوصية' : 'Error getting recommendation'}
                    </div>
                `;
                resultDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = isArabic ? '🎯 احصل على التوصية' : '🎯 Get Recommendation';
            }
        }

        displayRecommendation(recommendation) {
            const resultDiv = document.getElementById('miqasi-recommendation-result');
            const isArabic = this.config.language === 'ar';
            
            resultDiv.innerHTML = `
                <div class="miqasi-recommendation-result">
                    <div class="miqasi-recommended-size">
                        ${isArabic ? 'المقاس المقترح:' : 'Recommended Size:'} ${recommendation.recommended_size}
                    </div>
                    <div class="miqasi-confidence">
                        ${isArabic ? 'دقة التوصية:' : 'Confidence:'} ${recommendation.confidence}%
                    </div>
                    <p style="margin-top: 12px; font-size: 14px; color: #4a5568;">
                        ${recommendation.explanation}
                    </p>
                </div>
            `;
            
            resultDiv.style.display = 'block';
        }
    }

    // Auto-initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.miqasiWidget = new UniversalSizeWidget();
        });
    } else {
        window.miqasiWidget = new UniversalSizeWidget();
    }

    // Expose constructor for manual initialization
    window.MiqasiSizeGuide = UniversalSizeWidget;

})();