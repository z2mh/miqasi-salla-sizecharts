/**
 * Miqasi Size Guide Widget
 * Displays a "Size Guide" button on product pages that opens a popup with:
 * - Size Chart Tab (measurements table)
 * - Size Recommendation Tab (height/weight form)
 */

class MiqasiSizeGuide {
    constructor(config = {}) {
        this.merchantId = config.merchantId;
        this.productId = config.productId;
        this.apiUrl = config.apiUrl || 'http://localhost:8082';
        this.buttonText = config.buttonText || {
            en: '📏 Size Guide',
            ar: '📏 دليل المقاسات'
        };
        this.language = config.language || 'ar';
        
        this.sizeChart = null;
        this.modalOpen = false;
        
        this.init();
    }

    async init() {
        // Check if size chart exists for this product
        const hasChart = await this.checkSizeChart();
        if (hasChart) {
            this.createButton();
            this.createModal();
            this.attachEvents();
        }
    }

    async checkSizeChart() {
        try {
            const response = await fetch(`${this.apiUrl}/api/chart-exists/${this.merchantId}/${this.productId}`);
            const data = await response.json();
            if (data.exists) {
                this.sizeChart = data.chart;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking size chart:', error);
            return false;
        }
    }

    createButton() {
        // Find where to insert the button (after add to cart button)
        const insertLocation = this.findInsertLocation();
        if (!insertLocation) return;

        const button = document.createElement('button');
        button.id = 'miqasi-size-guide-btn';
        button.className = 'miqasi-size-guide-button';
        button.innerHTML = this.buttonText[this.language];
        button.style.cssText = `
            background: #48bb78;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 0;
            width: 100%;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#38a169';
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#48bb78';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        insertLocation.appendChild(button);
    }

    findInsertLocation() {
        // Try multiple selectors to find the best insertion point
        const selectors = [
            '.product-form__buttons',
            '.product__add-to-cart',
            '.btn-product-form',
            '.product-actions',
            '.product-form',
            '.add-to-cart-form',
            '[data-add-to-cart-form]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        // Fallback: create a container after the price
        const priceElements = document.querySelectorAll('.price, .product-price, [class*="price"]');
        if (priceElements.length > 0) {
            const container = document.createElement('div');
            container.className = 'miqasi-size-guide-container';
            priceElements[0].parentNode.insertBefore(container, priceElements[0].nextSibling);
            return container;
        }

        return null;
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'miqasi-size-guide-modal';
        modal.className = 'miqasi-modal';
        modal.innerHTML = `
            <div class="miqasi-modal-overlay">
                <div class="miqasi-modal-content">
                    <div class="miqasi-modal-header">
                        <h3>${this.language === 'ar' ? 'دليل المقاسات' : 'Size Guide'}</h3>
                        <button class="miqasi-close-btn" id="miqasi-close-modal">×</button>
                    </div>
                    
                    <div class="miqasi-tabs">
                        <button class="miqasi-tab-btn active" data-tab="chart">
                            ${this.language === 'ar' ? '📏 جدول المقاسات' : '📏 Size Chart'}
                        </button>
                        <button class="miqasi-tab-btn" data-tab="recommendation">
                            ${this.language === 'ar' ? '🎯 توصية المقاس' : '🎯 Size Recommendation'}
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

        // Add modal styles
        const styles = `
            <style>
                .miqasi-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: none;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .miqasi-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .miqasi-modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    animation: miqasi-modal-enter 0.3s ease-out;
                }
                
                @keyframes miqasi-modal-enter {
                    from { opacity: 0; transform: scale(0.9) translateY(-20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                .miqasi-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #e5e5e5;
                }
                
                .miqasi-modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #1a202c;
                }
                
                .miqasi-close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #718096;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                
                .miqasi-close-btn:hover {
                    background: #f7fafc;
                    color: #2d3748;
                }
                
                .miqasi-tabs {
                    display: flex;
                    border-bottom: 1px solid #e5e5e5;
                }
                
                .miqasi-tab-btn {
                    flex: 1;
                    padding: 16px 20px;
                    background: none;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    color: #718096;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                
                .miqasi-tab-btn:hover {
                    color: #2d3748;
                    background: #f7fafc;
                }
                
                .miqasi-tab-btn.active {
                    color: #48bb78;
                    border-bottom-color: #48bb78;
                }
                
                .miqasi-tab-content {
                    padding: 24px;
                }
                
                .miqasi-tab-pane {
                    display: none;
                }
                
                .miqasi-tab-pane.active {
                    display: block;
                }
                
                .miqasi-size-chart-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 16px;
                }
                
                .miqasi-size-chart-table th,
                .miqasi-size-chart-table td {
                    padding: 12px;
                    text-align: center;
                    border: 1px solid #e5e5e5;
                }
                
                .miqasi-size-chart-table th {
                    background: #f7fafc;
                    font-weight: 600;
                    color: #2d3748;
                }
                
                .miqasi-form-group {
                    margin-bottom: 20px;
                }
                
                .miqasi-form-label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #2d3748;
                }
                
                .miqasi-form-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e5e5e5;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s;
                }
                
                .miqasi-form-input:focus {
                    outline: none;
                    border-color: #48bb78;
                    box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
                }
                
                .miqasi-btn {
                    background: #48bb78;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    width: 100%;
                }
                
                .miqasi-btn:hover {
                    background: #38a169;
                }
                
                .miqasi-btn:disabled {
                    background: #cbd5e0;
                    cursor: not-allowed;
                }
                
                .miqasi-recommendation-result {
                    margin-top: 20px;
                    padding: 16px;
                    border-radius: 8px;
                    background: #f0fff4;
                    border: 1px solid #9ae6b4;
                }
                
                .miqasi-recommended-size {
                    font-size: 24px;
                    font-weight: bold;
                    color: #22543d;
                    text-align: center;
                    margin-bottom: 8px;
                }
                
                .miqasi-confidence {
                    text-align: center;
                    color: #38a169;
                    font-weight: 500;
                }
                
                @media (max-width: 640px) {
                    .miqasi-modal-overlay {
                        padding: 10px;
                    }
                    
                    .miqasi-modal-content {
                        max-height: 90vh;
                    }
                    
                    .miqasi-tab-content {
                        padding: 16px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(modal);
    }

    generateSizeChartHTML() {
        if (!this.sizeChart || !this.sizeChart.rows) {
            return '<p>جدول المقاسات غير متوفر</p>';
        }

        const headers = ['المقاس', 'الصدر', 'الخصر', 'الطول'];
        const unit = this.sizeChart.unit || 'سم';

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
                جميع المقاسات بالـ ${unit === 'cm' ? 'سنتيمتر' : 'إنش'}
            </p>
        `;

        return tableHTML;
    }

    generateRecommendationHTML() {
        return `
            <form id="miqasi-recommendation-form">
                <div class="miqasi-form-group">
                    <label class="miqasi-form-label">الطول (سم)</label>
                    <input type="number" class="miqasi-form-input" id="miqasi-height" 
                           placeholder="مثال: 170" min="100" max="250" required>
                </div>
                
                <div class="miqasi-form-group">
                    <label class="miqasi-form-label">الوزن (كيلو)</label>
                    <input type="number" class="miqasi-form-input" id="miqasi-weight" 
                           placeholder="مثال: 70" min="30" max="200" required>
                </div>
                
                <div class="miqasi-form-group">
                    <label class="miqasi-form-label">تفضيل الارتداء</label>
                    <select class="miqasi-form-input" id="miqasi-fit-preference">
                        <option value="regular">عادي</option>
                        <option value="tight">ضيق</option>
                        <option value="loose">واسع</option>
                    </select>
                </div>
                
                <button type="submit" class="miqasi-btn">
                    🎯 احصل على التوصية
                </button>
                
                <div id="miqasi-recommendation-result" style="display: none;"></div>
            </form>
        `;
    }

    attachEvents() {
        // Open modal button
        document.getElementById('miqasi-size-guide-btn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal events
        document.getElementById('miqasi-close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Close on overlay click
        document.querySelector('.miqasi-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        // Tab switching
        document.querySelectorAll('.miqasi-tab-btn').forEach(btn => {
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

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOpen) {
                this.closeModal();
            }
        });
    }

    openModal() {
        const modal = document.getElementById('miqasi-size-guide-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.modalOpen = true;
    }

    closeModal() {
        const modal = document.getElementById('miqasi-size-guide-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        this.modalOpen = false;
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.miqasi-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.miqasi-tab-pane').forEach(pane => {
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

        if (!height || !weight) {
            alert('يرجى إدخال الطول والوزن');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ جارٍ الحساب...';

        try {
            const response = await fetch(`${this.apiUrl}/api/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    merchant_id: this.merchantId,
                    product_id: this.productId,
                    height: parseFloat(height),
                    weight: parseFloat(weight),
                    fit_preference: fitPreference
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayRecommendation(data.recommendation);
            } else {
                throw new Error(data.error || 'فشل في الحصول على التوصية');
            }
        } catch (error) {
            console.error('Error getting recommendation:', error);
            resultDiv.innerHTML = `
                <div style="color: #e53e3e; text-align: center; padding: 16px;">
                    ❌ حدث خطأ في الحصول على التوصية. يرجى المحاولة مرة أخرى.
                </div>
            `;
            resultDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🎯 احصل على التوصية';
        }
    }

    displayRecommendation(recommendation) {
        const resultDiv = document.getElementById('miqasi-recommendation-result');
        
        resultDiv.innerHTML = `
            <div class="miqasi-recommendation-result">
                <div class="miqasi-recommended-size">
                    المقاس المقترح: ${recommendation.recommended_size}
                </div>
                <div class="miqasi-confidence">
                    دقة التوصية: ${recommendation.confidence}%
                </div>
                <p style="margin-top: 12px; font-size: 14px; color: #4a5568;">
                    ${recommendation.explanation}
                </p>
            </div>
        `;
        
        resultDiv.style.display = 'block';
    }
}

// Auto-initialize if config is available
window.MiqasiSizeGuide = MiqasiSizeGuide;

// Auto-detect and initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-miqasi-merchant-id]');
    if (autoInit) {
        const config = {
            merchantId: autoInit.getAttribute('data-miqasi-merchant-id'),
            productId: autoInit.getAttribute('data-miqasi-product-id'),
            apiUrl: autoInit.getAttribute('data-miqasi-api-url'),
            language: autoInit.getAttribute('data-miqasi-language') || 'ar'
        };
        
        new MiqasiSizeGuide(config);
    }
});