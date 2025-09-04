/**
 * Miqasi Size Chart Widget for Salla Stores
 * Automatically injects size guide buttons on product pages
 */

(function() {
    'use strict';
    
    // Configuration
    const WIDGET_CONFIG = {
        apiBase: 'https://app.trynashr.com/api',
        buttonText: {
            ar: '📏 دليل المقاسات',
            en: '📏 Size Guide'
        },
        position: 'after_price'
    };
    
    // Detect current product
    function getCurrentProduct() {
        // Try multiple methods to get product ID
        const productId = 
            window.location.pathname.match(/\/product\/(\d+)/)?.[1] ||
            document.querySelector('[data-product-id]')?.dataset.productId ||
            document.querySelector('meta[property="product:id"]')?.content ||
            window.salla?.product?.id;
            
        return productId;
    }
    
    // Get store ID from Salla
    function getStoreId() {
        return window.salla?.config?.store?.id || 
               document.querySelector('meta[name="store-id"]')?.content ||
               'demo';
    }
    
    // Check if size chart exists for this product
    async function checkSizeChart(storeId, productId) {
        try {
            const response = await fetch(`${WIDGET_CONFIG.apiBase}/chart/${storeId}/${productId}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.log('Miqasi: No size chart found for this product');
            return null;
        }
    }
    
    // Create size guide button
    function createSizeGuideButton(chartData) {
        const button = document.createElement('button');
        button.id = 'miqasi-size-guide-btn';
        button.innerHTML = WIDGET_CONFIG.buttonText.ar;
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: 15px 0;
            transition: transform 0.2s;
            width: 100%;
            max-width: 300px;
        `;
        
        button.addEventListener('mouseover', () => {
            button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.transform = 'translateY(0)';
        });
        
        button.addEventListener('click', () => {
            openSizeGuideModal(chartData);
        });
        
        return button;
    }
    
    // Create size guide modal
    function openSizeGuideModal(chartData) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'miqasi-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 15px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;
        
        modal.innerHTML = createModalContent(chartData);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close modal handlers
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
        
        function closeModal() {
            document.body.removeChild(overlay);
        }
        
        // Add close button functionality
        modal.querySelector('#close-modal').addEventListener('click', closeModal);
        
        // Add recommendation functionality
        setupRecommendationTab(chartData);
    }
    
    // Create modal HTML content
    function createModalContent(chartData) {
        const sizes = Object.keys(chartData.sizes).sort();
        
        let sizeTableRows = '';
        sizes.forEach(size => {
            const measurements = chartData.sizes[size];
            sizeTableRows += `
                <tr>
                    <td style="font-weight: bold; background: #f8f9ff;">${size}</td>
                    <td>${measurements.chest || '-'} سم</td>
                    <td>${measurements.waist || '-'} سم</td>
                    <td>${measurements.length || '-'} سم</td>
                </tr>
            `;
        });
        
        return `
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 25px;">
                    <h2 style="color: #333; font-size: 24px; margin: 0;">📏 دليل المقاسات</h2>
                    <button id="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">✕</button>
                </div>
                
                <!-- Tabs -->
                <div style="display: flex; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                    <button class="tab-btn active" data-tab="chart" style="flex: 1; padding: 12px; border: none; background: none; font-size: 16px; font-weight: 600; color: #667eea; border-bottom: 2px solid #667eea; cursor: pointer;">
                        جدول المقاسات
                    </button>
                    <button class="tab-btn" data-tab="recommend" style="flex: 1; padding: 12px; border: none; background: none; font-size: 16px; color: #666; cursor: pointer;">
                        توصية المقاس
                    </button>
                </div>
                
                <!-- Size Chart Tab -->
                <div id="chart-tab" class="tab-content">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr style="background: #667eea; color: white;">
                                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">المقاس</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">الصدر</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">الخصر</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">الطول</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sizeTableRows}
                            </tbody>
                        </table>
                    </div>
                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; font-size: 14px; color: #666;">
                        💡 <strong>ملاحظة:</strong> جميع القياسات بالسنتيمتر. للحصول على أفضل النتائج، قم بقياس الجسم مباشرة.
                    </div>
                </div>
                
                <!-- Recommendation Tab -->
                <div id="recommend-tab" class="tab-content" style="display: none;">
                    <div style="background: #f8f9ff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #333; margin-bottom: 15px;">🤖 احصل على توصية المقاس المناسب</h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">الطول (سم)</label>
                                <input type="number" id="user-height" placeholder="مثال: 170" style="width: 100%; padding: 10px; border: 2px solid #e1e5e9; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">الوزن (كجم)</label>
                                <input type="number" id="user-weight" placeholder="مثال: 70" style="width: 100%; padding: 10px; border: 2px solid #e1e5e9; border-radius: 6px;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">نوع القطعة</label>
                            <select id="fit-preference" style="width: 100%; padding: 10px; border: 2px solid #e1e5e9; border-radius: 6px;">
                                <option value="regular">عادي - مريح</option>
                                <option value="tight">ضيق - محكم</option>
                                <option value="loose">واسع - فضفاض</option>
                            </select>
                        </div>
                        
                        <button id="get-recommendation" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                            🎯 احصل على التوصية
                        </button>
                        
                        <div id="recommendation-result" style="margin-top: 20px; display: none;"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Setup recommendation functionality
    function setupRecommendationTab(chartData) {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.style.color = '#666';
                    b.style.borderBottom = 'none';
                    b.classList.remove('active');
                });
                btn.style.color = '#667eea';
                btn.style.borderBottom = '2px solid #667eea';
                btn.classList.add('active');
                
                // Show/hide tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById(`${tabId}-tab`).style.display = 'block';
            });
        });
        
        // Recommendation button
        document.getElementById('get-recommendation').addEventListener('click', async () => {
            const height = document.getElementById('user-height').value;
            const weight = document.getElementById('user-weight').value;
            const fit = document.getElementById('fit-preference').value;
            
            if (!height || !weight) {
                alert('⚠️ الرجاء إدخال الطول والوزن');
                return;
            }
            
            const recommendation = calculateRecommendation(chartData, parseInt(height), parseInt(weight), fit);
            showRecommendationResult(recommendation);
        });
    }
    
    // Calculate size recommendation
    function calculateRecommendation(chartData, height, weight, fit) {
        // Simple algorithm for demonstration
        // In production, this would be more sophisticated
        
        // Estimate body measurements based on height and weight
        const estimatedChest = Math.round(height * 0.52 + weight * 0.25);
        const estimatedWaist = Math.round(height * 0.42 + weight * 0.35);
        
        // Adjust for fit preference
        const adjustment = {
            tight: -3,
            regular: 0,
            loose: 3
        };
        
        const targetChest = estimatedChest + adjustment[fit];
        const targetWaist = estimatedWaist + adjustment[fit];
        
        // Find best matching size
        let bestMatch = null;
        let minDifference = Infinity;
        
        Object.entries(chartData.sizes).forEach(([size, measurements]) => {
            if (measurements.chest && measurements.waist) {
                const chestDiff = Math.abs(measurements.chest - targetChest);
                const waistDiff = Math.abs(measurements.waist - targetWaist);
                const totalDiff = chestDiff + waistDiff;
                
                if (totalDiff < minDifference) {
                    minDifference = totalDiff;
                    bestMatch = { size, measurements, difference: totalDiff };
                }
            }
        });
        
        const confidence = Math.max(60, Math.min(95, 95 - (minDifference * 2)));
        
        return {
            recommendedSize: bestMatch?.size,
            confidence: Math.round(confidence),
            estimatedChest,
            estimatedWaist,
            explanation: `بناءً على طولك (${height} سم) ووزنك (${weight} كجم)، نقدر مقاسات جسمك كالتالي: الصدر ${estimatedChest} سم، الخصر ${estimatedWaist} سم.`
        };
    }
    
    // Show recommendation result
    function showRecommendationResult(recommendation) {
        const resultDiv = document.getElementById('recommendation-result');
        
        if (!recommendation.recommendedSize) {
            resultDiv.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; color: #856404;">
                    ⚠️ لم نتمكن من العثور على توصية مناسبة. يرجى مراجعة جدول المقاسات.
                </div>
            `;
        } else {
            const confidenceColor = recommendation.confidence >= 80 ? '#28a745' : 
                                  recommendation.confidence >= 60 ? '#ffc107' : '#dc3545';
            
            resultDiv.innerHTML = `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <div style="font-size: 32px; margin-bottom: 10px;">🎯</div>
                        <h3 style="color: #155724; margin: 0;">المقاس المُوصى به: <span style="font-size: 28px; color: #667eea;">${recommendation.recommendedSize}</span></h3>
                        <div style="margin-top: 8px;">
                            <span style="background: ${confidenceColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                دقة التوصية: ${recommendation.confidence}%
                            </span>
                        </div>
                    </div>
                    <div style="color: #155724; font-size: 14px; line-height: 1.5;">
                        ${recommendation.explanation}
                    </div>
                </div>
            `;
        }
        
        resultDiv.style.display = 'block';
    }
    
    // Find insertion point for button
    function findInsertionPoint() {
        // Try multiple selectors to find the best place to insert button
        const selectors = [
            '.product-price',
            '.price',
            '.product-info .price',
            '.product-details .price',
            '[class*="price"]',
            '.add-to-cart',
            '.product-actions',
            '.product-form'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        
        return null;
    }
    
    // Initialize widget
    async function initWidget() {
        // Check if we're on a product page
        const productId = getCurrentProduct();
        if (!productId) {
            console.log('Miqasi: Not a product page');
            return;
        }
        
        const storeId = getStoreId();
        console.log(`Miqasi: Checking size chart for store ${storeId}, product ${productId}`);
        
        // Check if size chart exists
        const chartData = await checkSizeChart(storeId, productId);
        if (!chartData) {
            console.log('Miqasi: No size chart found for this product');
            return;
        }
        
        // Find where to insert the button
        const insertionPoint = findInsertionPoint();
        if (!insertionPoint) {
            console.log('Miqasi: Could not find insertion point');
            return;
        }
        
        // Create and insert the button
        const button = createSizeGuideButton(chartData);
        
        if (WIDGET_CONFIG.position === 'after_price') {
            insertionPoint.parentNode.insertBefore(button, insertionPoint.nextSibling);
        } else {
            insertionPoint.parentNode.insertBefore(button, insertionPoint);
        }
        
        console.log('Miqasi: Size guide button added successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
    
    // Re-initialize on Salla theme changes (for SPA-like behavior)
    if (window.salla) {
        window.salla.event?.on?.('theme::page::loaded', initWidget);
    }
    
})();