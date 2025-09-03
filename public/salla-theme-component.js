/**
 * Miqasi Size Guide - Salla Theme Integration
 * This component integrates with Salla's native theme system
 * Uses <salla-product-size-guide> component
 */

(function() {
    'use strict';

    // Configuration from Salla store
    const MiqasiSallaConfig = {
        apiUrl: window.salla?.config?.app?.api_url || 'http://localhost:8082',
        merchantId: window.salla?.config?.store?.id || null,
        language: document.documentElement.lang || 'ar',
        debug: window.salla?.config?.app?.debug || false
    };

    class MiqasiSallaTheme {
        constructor() {
            this.productId = null;
            this.sizeChart = null;
            this.isInitialized = false;

            this.log('🚀 Initializing Miqasi Salla Theme Component');
            this.init();
        }

        log(message, ...args) {
            if (MiqasiSallaConfig.debug) {
                console.log(`[Miqasi Theme] ${message}`, ...args);
            }
        }

        async init() {
            // Wait for Salla to be ready
            if (typeof salla === 'undefined') {
                setTimeout(() => this.init(), 500);
                return;
            }

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                this.initialize();
            }
        }

        async initialize() {
            this.log('🔍 Initializing Salla theme integration...');

            // 1. Check if we're on a product page
            if (!this.isProductPage()) {
                this.log('ℹ️ Not a product page');
                return;
            }

            // 2. Get product information
            this.productId = this.getProductId();
            if (!this.productId) {
                this.log('❌ Could not get product ID');
                return;
            }

            this.log('✅ Product ID:', this.productId);

            // 3. Check if size chart exists
            const hasChart = await this.checkSizeChart();
            if (!hasChart) {
                this.log('ℹ️ No size chart found for product:', this.productId);
                return;
            }

            // 4. Integrate with Salla theme
            this.integrateWithTheme();
            this.isInitialized = true;
            this.log('✅ Salla theme integration completed');
        }

        isProductPage() {
            // Check for product page indicators
            return document.querySelector('[data-product-id]') || 
                   document.querySelector('.product-entry') ||
                   window.location.pathname.includes('/product/');
        }

        getProductId() {
            // Method 1: From Salla global config
            if (salla?.config?.product?.id) {
                return salla.config.product.id;
            }

            // Method 2: From DOM attributes
            const productEl = document.querySelector('[data-product-id]');
            if (productEl) {
                return productEl.getAttribute('data-product-id');
            }

            // Method 3: From URL
            const urlMatch = window.location.pathname.match(/\/product\/([^\/\?]+)/);
            if (urlMatch) {
                return urlMatch[1];
            }

            // Method 4: From add to cart form
            const addToCartInput = document.querySelector('[name="add-to-cart"]');
            if (addToCartInput) {
                return addToCartInput.value;
            }

            return null;
        }

        async checkSizeChart() {
            try {
                const response = await fetch(
                    `${MiqasiSallaConfig.apiUrl}/api/salla/chart/${MiqasiSallaConfig.merchantId}/${this.productId}`
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

        integrateWithTheme() {
            this.log('🎨 Integrating with Salla theme...');

            // Method 1: Use Salla's native size guide component (if available)
            this.tryNativeSallaIntegration();

            // Method 2: Fallback to custom integration
            this.createCustomSizeGuideButton();

            // Method 3: Listen for Salla events
            this.setupSallaEventListeners();
        }

        tryNativeSallaIntegration() {
            // Check if Salla has native size guide component
            if (typeof customElements !== 'undefined' && customElements.get('salla-product-size-guide')) {
                this.log('✅ Using Salla native size guide component');
                this.setupNativeSallaComponent();
            } else {
                this.log('ℹ️ Salla native component not found, using custom integration');
            }
        }

        setupNativeSallaComponent() {
            // Find or create the native Salla size guide component
            let sallaGuide = document.querySelector('salla-product-size-guide');
            
            if (!sallaGuide) {
                // Create the component
                sallaGuide = document.createElement('salla-product-size-guide');
                
                // Find the best place to insert it
                const productForm = document.querySelector('.product-form, .add-to-cart-form, .product-entry');
                if (productForm) {
                    productForm.appendChild(sallaGuide);
                }
            }

            // Configure the component with our data
            if (sallaGuide && this.sizeChart) {
                // Set up the size guide data
                sallaGuide.setAttribute('product-id', this.productId);
                
                // Custom header slot
                const header = document.createElement('div');
                header.slot = 'header';
                header.innerHTML = `
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px 12px 0 0;">
                        <h3 style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <span>📏</span>
                            ${MiqasiSallaConfig.language === 'ar' ? 'دليل المقاسات الذكي' : 'Smart Size Guide'}
                        </h3>
                    </div>
                `;
                sallaGuide.appendChild(header);

                // Custom content
                const content = document.createElement('div');
                content.slot = 'content';
                content.innerHTML = this.generateSizeChartContent();
                sallaGuide.appendChild(content);

                this.log('✅ Configured Salla native component');
            }
        }

        createCustomSizeGuideButton() {
            // Find the best location to add our button
            const insertLocation = this.findButtonLocation();
            if (!insertLocation) {
                this.log('❌ Could not find button location');
                return;
            }

            // Create the button
            const button = this.createSizeGuideButton();
            insertLocation.appendChild(button);

            // Create the modal
            this.createSizeGuideModal();

            this.log('✅ Custom size guide button created');
        }

        findButtonLocation() {
            const locations = [
                // Salla-specific selectors
                '.product-form .form-group:last-child',
                '.add-to-cart-form',
                '.product-entry .btn-container',
                '.s-button-container',
                
                // Generic selectors
                '.product-actions',
                '.product-form',
                
                // Create container after add to cart button
                () => {
                    const addToCartBtn = document.querySelector('[data-add-to-cart], .add-to-cart-btn, .btn-addtocart');
                    if (addToCartBtn) {
                        const container = document.createElement('div');
                        container.className = 'miqasi-size-guide-container';
                        container.style.cssText = 'margin: 15px 0;';
                        addToCartBtn.parentNode.insertBefore(container, addToCartBtn.nextSibling);
                        return container;
                    }
                    return null;
                }
            ];

            for (const location of locations) {
                if (typeof location === 'function') {
                    const result = location();
                    if (result) return result;
                } else {
                    const element = document.querySelector(location);
                    if (element) return element;
                }
            }

            return null;
        }

        createSizeGuideButton() {
            const button = document.createElement('salla-button');
            button.setAttribute('shape', 'btn');
            button.setAttribute('color', 'primary');
            button.setAttribute('width', 'wide');
            button.className = 'miqasi-size-guide-btn';
            button.style.cssText = `
                margin: 10px 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: all 0.3s ease;
            `;

            button.innerHTML = `
                <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>📏</span>
                    <span>${MiqasiSallaConfig.language === 'ar' ? 'دليل المقاسات' : 'Size Guide'}</span>
                </span>
            `;

            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            });

            // Add click handler
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSizeGuideModal();
            });

            return button;
        }

        createSizeGuideModal() {
            // Use Salla's modal component if available
            let modal = document.querySelector('#miqasi-salla-modal');
            if (!modal) {
                modal = document.createElement('salla-modal');
                modal.id = 'miqasi-salla-modal';
                modal.setAttribute('width', 'lg');
                modal.innerHTML = `
                    <div slot="header">
                        <h3 style="display: flex; align-items: center; gap: 10px; margin: 0;">
                            <span>📏</span>
                            ${MiqasiSallaConfig.language === 'ar' ? 'دليل المقاسات الذكي' : 'Smart Size Guide'}
                        </h3>
                    </div>
                    <div slot="body">
                        ${this.generateModalContent()}
                    </div>
                `;
                document.body.appendChild(modal);
            }
        }

        generateModalContent() {
            return `
                <div class="miqasi-modal-tabs">
                    <salla-tabs>
                        <salla-tab-header slot="headers">
                            <salla-tab-button target="size-chart" class="active">
                                📊 ${MiqasiSallaConfig.language === 'ar' ? 'جدول المقاسات' : 'Size Chart'}
                            </salla-tab-button>
                            <salla-tab-button target="recommendation">
                                🎯 ${MiqasiSallaConfig.language === 'ar' ? 'توصية ذكية' : 'Smart Recommendation'}
                            </salla-tab-button>
                        </salla-tab-header>

                        <salla-tab-content slot="contents">
                            <salla-tab-panel name="size-chart" class="active">
                                ${this.generateSizeChartContent()}
                            </salla-tab-panel>
                            <salla-tab-panel name="recommendation">
                                ${this.generateRecommendationContent()}
                            </salla-tab-panel>
                        </salla-tab-content>
                    </salla-tabs>
                </div>

                <style>
                    .miqasi-size-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    .miqasi-size-table th {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 12px;
                        text-align: center;
                        font-weight: 700;
                    }
                    .miqasi-size-table td {
                        padding: 12px;
                        text-align: center;
                        border-bottom: 1px solid #f3f4f6;
                    }
                    .miqasi-size-table tr:nth-child(even) td {
                        background: #fafbff;
                    }
                    .miqasi-form-group {
                        margin-bottom: 20px;
                    }
                    .miqasi-form-label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #374151;
                    }
                    .miqasi-recommendation-result {
                        margin-top: 20px;
                        padding: 20px;
                        border-radius: 12px;
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        text-align: center;
                        animation: slideIn 0.3s ease;
                    }
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
            `;
        }

        generateSizeChartContent() {
            if (!this.sizeChart || !this.sizeChart.rows) {
                return `<p>${MiqasiSallaConfig.language === 'ar' ? 'جدول المقاسات غير متوفر' : 'Size chart not available'}</p>`;
            }

            const headers = MiqasiSallaConfig.language === 'ar' ? 
                ['المقاس', 'الصدر', 'الخصر', 'الطول'] : 
                ['Size', 'Chest', 'Waist', 'Length'];
            const unit = this.sizeChart.unit || 'cm';

            let tableHTML = `
                <table class="miqasi-size-table">
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
            `;

            this.sizeChart.rows.forEach((row, index) => {
                tableHTML += `
                    <tr>
                        <td><strong style="color: #667eea;">${row.size}</strong></td>
                        <td>${row.chest || '-'} ${row.chest ? unit : ''}</td>
                        <td>${row.waist || '-'} ${row.waist ? unit : ''}</td>
                        <td>${row.length || '-'} ${row.length ? unit : ''}</td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
                <div style="text-align: center; color: #6b7280; font-size: 14px; padding: 10px;">
                    ${MiqasiSallaConfig.language === 'ar' ? 
                        `جميع المقاسات بالـ ${unit === 'cm' ? 'سنتيمتر' : 'إنش'}` :
                        `All measurements in ${unit === 'cm' ? 'centimeters' : 'inches'}`
                    }
                </div>
            `;

            return tableHTML;
        }

        generateRecommendationContent() {
            const isArabic = MiqasiSallaConfig.language === 'ar';
            
            return `
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">🎯</div>
                    <h4 style="margin: 0; color: #1f2937; font-size: 20px;">
                        ${isArabic ? 'احصل على توصية ذكية للمقاس' : 'Get Smart Size Recommendation'}
                    </h4>
                    <p style="color: #6b7280; margin: 10px 0;">
                        ${isArabic ? 'أدخل طولك ووزنك للحصول على المقاس الأنسب' : 'Enter your height and weight for the perfect size'}
                    </p>
                </div>
                
                <form id="miqasi-recommendation-form" style="max-width: 400px; margin: 0 auto;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="miqasi-form-group">
                            <label class="miqasi-form-label">
                                📏 ${isArabic ? 'الطول (سم)' : 'Height (cm)'}
                            </label>
                            <salla-text-input 
                                type="number" 
                                id="miqasi-height" 
                                placeholder="${isArabic ? '170' : '170'}" 
                                min="100" 
                                max="250" 
                                required>
                            </salla-text-input>
                        </div>
                        
                        <div class="miqasi-form-group">
                            <label class="miqasi-form-label">
                                ⚖️ ${isArabic ? 'الوزن (كيلو)' : 'Weight (kg)'}
                            </label>
                            <salla-text-input 
                                type="number" 
                                id="miqasi-weight" 
                                placeholder="${isArabic ? '70' : '70'}" 
                                min="30" 
                                max="200" 
                                required>
                            </salla-text-input>
                        </div>
                    </div>
                    
                    <div class="miqasi-form-group">
                        <label class="miqasi-form-label">
                            👕 ${isArabic ? 'تفضيل الارتداء' : 'Fit Preference'}
                        </label>
                        <salla-select id="miqasi-fit-preference">
                            <option value="regular">${isArabic ? 'عادي (مريح)' : 'Regular (Comfortable)'}</option>
                            <option value="tight">${isArabic ? 'ضيق (محكم)' : 'Tight (Fitted)'}</option>
                            <option value="loose">${isArabic ? 'واسع (فضفاض)' : 'Loose (Relaxed)'}</option>
                        </salla-select>
                    </div>
                    
                    <salla-button 
                        type="submit" 
                        color="primary" 
                        width="wide"
                        style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin-top: 20px;">
                        🎯 ${isArabic ? 'احصل على التوصية' : 'Get Recommendation'}
                    </salla-button>
                    
                    <div id="miqasi-recommendation-result" style="display: none;"></div>
                </form>
            `;
        }

        openSizeGuideModal() {
            // Open using Salla's modal system or custom modal
            const modal = document.getElementById('miqasi-salla-modal');
            if (modal && typeof modal.open === 'function') {
                modal.open();
            } else {
                // Dispatch Salla event to open size guide
                salla.event.dispatch('size-guide::open', this.productId);
            }
        }

        setupSallaEventListeners() {
            // Listen for Salla-specific events
            if (typeof salla !== 'undefined' && salla.event) {
                // Listen for recommendation form submission
                salla.event.on('form::submit', (event) => {
                    if (event.target?.id === 'miqasi-recommendation-form') {
                        event.preventDefault();
                        this.handleRecommendationSubmit(event.target);
                    }
                });

                this.log('✅ Salla event listeners setup');
            }
        }

        async handleRecommendationSubmit(form) {
            const height = form.querySelector('#miqasi-height')?.value;
            const weight = form.querySelector('#miqasi-weight')?.value;
            const fitPreference = form.querySelector('#miqasi-fit-preference')?.value || 'regular';
            const resultDiv = document.getElementById('miqasi-recommendation-result');
            
            if (!height || !weight) {
                salla.notify.error(
                    MiqasiSallaConfig.language === 'ar' ? 
                    'يرجى إدخال الطول والوزن' : 
                    'Please enter height and weight'
                );
                return;
            }

            try {
                const response = await fetch(`${MiqasiSallaConfig.apiUrl}/api/recommend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        merchant_id: MiqasiSallaConfig.merchantId,
                        product_id: this.productId,
                        height: parseFloat(height),
                        weight: parseFloat(weight),
                        fit_preference: fitPreference
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.displayRecommendation(data.recommendation, resultDiv);
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                this.log('Error getting recommendation:', error);
                salla.notify.error(
                    MiqasiSallaConfig.language === 'ar' ? 
                    'حدث خطأ في الحصول على التوصية' : 
                    'Error getting recommendation'
                );
            }
        }

        displayRecommendation(recommendation, resultDiv) {
            const isArabic = MiqasiSallaConfig.language === 'ar';
            
            resultDiv.innerHTML = `
                <div class="miqasi-recommendation-result">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">
                        ${recommendation.recommended_size}
                    </div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px; opacity: 0.9;">
                        ${isArabic ? 'دقة التوصية:' : 'Confidence:'} ${recommendation.confidence}%
                    </div>
                    <p style="margin: 0; font-size: 14px; opacity: 0.8; line-height: 1.5;">
                        ${recommendation.explanation}
                    </p>
                </div>
            `;
            
            resultDiv.style.display = 'block';
        }
    }

    // Initialize when DOM is ready and Salla is loaded
    function initMiqasiTheme() {
        if (typeof salla !== 'undefined') {
            new MiqasiSallaTheme();
        } else {
            // Wait for Salla to load
            setTimeout(initMiqasiTheme, 500);
        }
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMiqasiTheme);
    } else {
        initMiqasiTheme();
    }

    // Expose for manual initialization
    window.MiqasiSallaTheme = MiqasiSallaTheme;

})();