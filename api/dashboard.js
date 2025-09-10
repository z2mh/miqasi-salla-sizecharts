// Dashboard endpoint with Salla integration
export default function handler(req, res) {
  try {
    const { access_token, store_id } = req.query;
    
    // If no access token, show login screen
    if (!access_token) {
      const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مقاسي - تسجيل الدخول</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0; 
            padding: 20px;
            background: #ed9166; 
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: #fffffff2;
            color: #333;
            padding: 60px;
            border-radius: 20px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .logo { font-size: 4rem; margin-bottom: 20px; }
        h1 { color: #333; font-size: 2rem; margin-bottom: 15px; }
        .subtitle { color: #666; margin-bottom: 40px; font-size: 1.1rem; line-height: 1.6; }
        .login-btn {
            background: #ed9166;
            color: white;
            border: none;
            padding: 18px 40px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
            margin-bottom: 30px;
        }
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102,126,234,0.3);
        }
        .features {
            text-align: right;
            background: #f8f9ff;
            padding: 25px;
            border-radius: 12px;
            margin-top: 30px;
        }
        .feature { margin: 15px 0; color: #555; }
        .feature strong { color: #ed9166; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📏</div>
        <h1>مرحباً بك في مقاسي</h1>
        <div class="subtitle">
            نظام إدارة جداول المقاسات الذكي لمتاجر سلة<br>
            قم بتسجيل الدخول بحسابك في سلة للبدء
        </div>
        
        <a href="/api/auth" class="login-btn">
            🔗 تسجيل الدخول بحساب سلة
        </a>
        
        <div class="features">
            <h3 style="color: #333; margin-bottom: 15px;">✨ المميزات</h3>
            <div class="feature">📊 <strong>إدارة شاملة:</strong> إنشاء وتعديل جداول المقاسات</div>
            <div class="feature">🤖 <strong>توصيات ذكية:</strong> اقتراح المقاس المناسب للعملاء</div>
            <div class="feature">🎨 <strong>تكامل سلس:</strong> يعمل مع جميع قوالب سلة</div>
            <div class="feature">📱 <strong>متجاوب:</strong> يعمل على جميع الأجهزة</div>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
    
    // If logged in, show dashboard
    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مقاسي - لوحة التحكم</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0; 
            padding: 0;
            background: #f5f6fa;
            color: #333;
        }
        .header {
            background: #ed9166;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 2rem; }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        select, input, button {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
        }
        select:focus, input:focus {
            outline: none;
            border-color: #ed9166;
        }
        .btn {
            background: #ed9166;
            color: white;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102,126,234,0.3);
        }
        .size-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .size-table th, .size-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
        }
        .size-table th {
            background: #ed9166;
            color: white;
        }
        .loading {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .container {
                padding: 15px 10px;
            }
            .card {
                padding: 20px;
                margin-bottom: 20px;
            }
            .header {
                padding: 15px;
            }
            .header h1 {
                font-size: 1.5rem;
            }
            .card[style*="grid-template-columns"] {
                display: block !important;
            }
            .card[style*="grid-template-columns"] > div {
                margin-bottom: 30px;
            }
            .form-group div[style*="grid-template-columns"] {
                display: block !important;
            }
            .form-group div[style*="grid-template-columns"] > * {
                margin-bottom: 10px;
                width: 100% !important;
            }
            .size-table {
                font-size: 12px;
            }
            .size-table th,
            .size-table td {
                padding: 8px 4px;
            }
        }
        
        @media (max-width: 480px) {
            .header h1 {
                font-size: 1.3rem;
            }
            .card {
                padding: 15px;
            }
            input, select, button {
                font-size: 14px;
            }
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📏 مقاسي - لوحة التحكم</h1>
        <p>مرحباً بك في نظام إدارة جداول المقاسات</p>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>📦 اختيار المنتج</h2>
            <div class="form-group">
                <label for="product-select">اختر المنتج لإضافة جدول المقاسات:</label>
                <select id="product-select">
                    <option value="">جاري تحميل المنتجات...</option>
                </select>
            </div>
        </div>
        
        <div class="card" id="chart-editor" style="display: none;">
            <h2>📏 إنشاء جدول المقاسات</h2>
            <div id="message-area"></div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <strong style="color: #856404;">⚠️ تأكد من دقة القياسات:</strong> استخدم الصورة التوضيحية والتعليمات أدناه لضمان الدقة
            </div>
            
            <div class="form-group">
                <label>إضافة مقاس جديد:</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; align-items: end;">
                    <input type="text" id="size-name" placeholder="المقاس (مثال: S)">
                    <input type="number" id="chest-size" placeholder="الصدر (سم)">
                    <input type="number" id="waist-size" placeholder="الخصر (سم)">
                    <input type="number" id="length-size" placeholder="الطول (سم)">
                    <button type="button" class="btn" id="add-size-btn">إضافة</button>
                </div>
            </div>
            
            <table class="size-table" id="sizes-table">
                <thead>
                    <tr>
                        <th>المقاس</th>
                        <th>الصدر (سم)</th>
                        <th>الخصر (سم)</th>
                        <th>الطول (سم)</th>
                        <th>إجراءات</th>
                    </tr>
                </thead>
                <tbody id="sizes-tbody">
                </tbody>
            </table>
            
            <div style="margin-top: 30px;">
                <button class="btn" id="save-chart-btn">💾 حفظ جدول المقاسات</button>
            </div>
        </div>
        
        <div class="card" style="display: grid; grid-template-columns: 1fr 400px; gap: 30px;">
            <!-- Instructions Panel -->
            <div>
                <h2>خطوات إضافة جدول المقاسات</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-right: 4px solid #ed9166; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="background: #ed9166; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-left: 10px; float: right;">1</div>
                    <h4 style="color: #ed9166; margin-bottom: 8px;">اختر المنتج</h4>
                    <p>اختر المنتج الذي تريد إضافة جدول المقاسات له من القائمة أدناه</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-right: 4px solid #ed9166; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="background: #ed9166; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-left: 10px; float: right;">2</div>
                    <h4 style="color: #ed9166; margin-bottom: 8px;">أضف المقاسات</h4>
                    <p>أدخل جميع المقاسات المتوفرة مع قياسات الصدر والخصر والطول لكل مقاس</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-right: 4px solid #ed9166; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="background: #ed9166; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-left: 10px; float: right;">3</div>
                    <h4 style="color: #ed9166; margin-bottom: 8px;">احفظ الجدول</h4>
                    <p>اضغط على "حفظ جدول المقاسات" وستظهر الأيقونة تلقائياً في صفحة المنتج</p>
                </div>
            </div>
            
            <!-- Measurement Guide Panel -->
            <div style="background: #fff3cd; padding: 25px; border-radius: 12px; border: 1px solid #ffeaa7;">
                <div style="text-align: center;">
                    <h3 style="color: #856404; font-size: 1.3rem; margin-bottom: 20px;">📐 دليل أخذ القياسات</h3>
                    
                    <!-- Measurement Image -->
                    <img src="/images/measurement-guide.jpg" 
                         alt="دليل القياسات" 
                         style="width: 100%; max-width: 300px; border: 2px solid #ffeaa7; border-radius: 10px; margin-bottom: 20px;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; padding: 40px; background: #f0f0f0; border: 2px dashed #ccc; border-radius: 10px; color: #666; margin-bottom: 20px;">
                        📷 ضع صورة دليل القياسات هنا<br>
                        <small>(measurement-guide.jpg)</small>
                    </div>
                    
                    <!-- Measurement Instructions -->
                    <div style="text-align: right; background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <h4 style="color: #ed9166; margin-bottom: 15px; font-size: 1.1rem;">تعليمات أخذ القياسات:</h4>
                        <ul style="list-style-type: none; padding: 0;">
                            <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.6;">
                                <strong style="color: #ed9166; margin-left: 8px;">الصدر:</strong>
                                قس حول أوسع جزء من الصدر تحت الإبطين مباشرة. تأكد من أن شريط القياس مستوي عبر الظهر وغير مشدود بقوة.
                            </li>
                            <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.6;">
                                <strong style="color: #ed9166; margin-left: 8px;">الخصر:</strong>
                                قس حول أضيق جزء من الخصر (عادة فوق السرة). اتركي شريط القياس مريحاً وطبيعياً.
                            </li>
                            <li style="padding: 8px 0; line-height: 1.6;">
                                <strong style="color: #ed9166; margin-left: 8px;">الطول:</strong>
                                قس من أعلى نقطة في الكتف (عند التقاء الكتف والرقبة) إلى النقطة المرغوبة للطول النهائي للملابس.
                            </li>
                        </ul>
                        
                        <!-- Additional Tips -->
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                            <h4 style="color: #2e7d32; margin-bottom: 10px;">💡 نصائح مهمة</h4>
                            <ul style="text-align: right; list-style: none; padding: 0;">
                                <li style="margin-bottom: 8px;">✅ استعن بشخص آخر لأخذ القياسات</li>
                                <li style="margin-bottom: 8px;">✅ ارتدي ملابس مناسبة ومريحة</li>
                                <li style="margin-bottom: 8px;">✅ تأكد من استقامة الجسم أثناء القياس</li>
                                <li style="margin-bottom: 8px;">✅ تأكد من أن شريط القياس غير مشدود بقوة</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const API_BASE = '';
        const ACCESS_TOKEN = '${access_token}';
        const STORE_ID = '${store_id}';
        let currentProduct = null;
        let sizeData = {};
        
        // Load products when page loads
        document.addEventListener('DOMContentLoaded', loadProducts);
        
        // Event listeners
        document.getElementById('product-select').addEventListener('change', handleProductSelect);
        document.getElementById('add-size-btn').addEventListener('click', addSize);
        document.getElementById('save-chart-btn').addEventListener('click', saveChart);
        
        async function loadProducts() {
            try {
                const response = await fetch(\`\${API_BASE}/api/products?access_token=\${ACCESS_TOKEN}\`);
                const data = await response.json();
                
                const select = document.getElementById('product-select');
                select.innerHTML = '<option value="">-- اختر منتج --</option>';
                
                if (data.success && data.products) {
                    data.products.forEach(product => {
                        const option = document.createElement('option');
                        option.value = product.id;
                        option.textContent = \`\${product.name} (ID: \${product.id})\`;
                        select.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error loading products:', error);
                document.getElementById('product-select').innerHTML = '<option value="">خطأ في تحميل المنتجات</option>';
            }
        }
        
        async function handleProductSelect(event) {
            const productId = event.target.value;
            const editor = document.getElementById('chart-editor');
            
            if (productId) {
                currentProduct = productId;
                sizeData = {};
                
                // Try to load existing size chart for this product
                await loadExistingSizeChart(productId);
                
                updateSizesTable();
                editor.style.display = 'block';
            } else {
                editor.style.display = 'none';
            }
        }
        
        async function loadExistingSizeChart(productId) {
            try {
                
                const response = await fetch(\`\${API_BASE}/api/chart-data?store_id=\${STORE_ID}&product_id=\${productId}\`);
                const data = await response.json();
                
                
                if (data.success && data.data && data.data.sizes) {
                    sizeData = data.data.sizes;
                    showMessage(\`📊 تم تحميل جدول المقاسات الموجود (\${Object.keys(sizeData).length} مقاسات)\`, 'success');
                } else {
                    sizeData = {};
                    showMessage('💡 لا يوجد جدول مقاسات لهذا المنتج - يمكنك إنشاء واحد جديد', 'success');
                }
            } catch (error) {
                sizeData = {};
                showMessage('💡 لا يوجد جدول مقاسات لهذا المنتج - يمكنك إنشاء واحد جديد', 'success');
            }
        }
        
        function addSize() {
            const sizeName = document.getElementById('size-name').value.trim();
            const chest = parseInt(document.getElementById('chest-size').value);
            const waist = parseInt(document.getElementById('waist-size').value);
            const length = parseInt(document.getElementById('length-size').value);
            
            if (!sizeName) {
                showMessage('الرجاء إدخال اسم المقاس', 'error');
                return;
            }
            
            if (sizeData[sizeName]) {
                showMessage('هذا المقاس موجود بالفعل', 'error');
                return;
            }
            
            sizeData[sizeName] = {
                chest: chest || null,
                waist: waist || null,
                length: length || null
            };
            
            // Clear inputs
            document.getElementById('size-name').value = '';
            document.getElementById('chest-size').value = '';
            document.getElementById('waist-size').value = '';
            document.getElementById('length-size').value = '';
            
            updateSizesTable();
            showMessage('تمت إضافة المقاس بنجاح', 'success');
        }
        
        function updateSizesTable() {
            const tbody = document.getElementById('sizes-tbody');
            tbody.innerHTML = '';
            
            Object.entries(sizeData).forEach(([sizeName, measurements]) => {
                const row = document.createElement('tr');
                row.innerHTML = \`
                    <td><strong>\${sizeName}</strong></td>
                    <td>\${measurements.chest || '-'}</td>
                    <td>\${measurements.waist || '-'}</td>
                    <td>\${measurements.length || '-'}</td>
                    <td>
                        <button onclick="removeSize('\${sizeName}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            حذف
                        </button>
                    </td>
                \`;
                tbody.appendChild(row);
            });
        }
        
        async function removeSize(sizeName) {
            if (confirm(\`هل تريد حذف المقاس \${sizeName}؟\`)) {
                delete sizeData[sizeName];
                updateSizesTable();
                
                // Auto-save to database after deletion
                if (currentProduct && Object.keys(sizeData).length > 0) {
                    try {
                        const response = await fetch(\`\${API_BASE}/api/chart-data\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                store_id: STORE_ID,
                                product_id: currentProduct,
                                chart_data: sizeData,
                                unit: 'cm'
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            showMessage('تم حذف المقاس وحفظ التغييرات', 'success');
                        } else {
                            showMessage('تم حذف المقاس محلياً، لكن فشل حفظ التغييرات: ' + (data.message || 'خطأ غير معروف'), 'error');
                        }
                    } catch (error) {
                        showMessage('تم حذف المقاس محلياً، لكن فشل حفظ التغييرات: خطأ في الاتصال', 'error');
                    }
                } else if (currentProduct && Object.keys(sizeData).length === 0) {
                    // If no sizes left, we could either:
                    // 1. Delete the entire chart from database, or
                    // 2. Save an empty chart
                    // Let's save an empty chart to keep the product record
                    showMessage('تم حذف المقاس - لا توجد مقاسات متبقية', 'success');
                } else {
                    showMessage('تم حذف المقاس', 'success');
                }
            }
        }
        
        async function saveChart() {
            if (!currentProduct) {
                showMessage('الرجاء اختيار منتج أولاً', 'error');
                return;
            }
            
            if (Object.keys(sizeData).length === 0) {
                showMessage('الرجاء إضافة مقاس واحد على الأقل', 'error');
                return;
            }
            
            try {
                const response = await fetch(\`\${API_BASE}/api/chart-data\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        store_id: STORE_ID,
                        product_id: currentProduct,
                        chart_data: sizeData,
                        unit: 'cm'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('✅ تم حفظ جدول المقاسات بنجاح! سيظهر الآن في متجرك.', 'success');
                } else {
                    showMessage('خطأ في حفظ جدول المقاسات: ' + (data.message || 'خطأ غير معروف'), 'error');
                }
            } catch (error) {
                showMessage('خطأ في الاتصال بالخادم', 'error');
            }
        }
        
        function showMessage(message, type) {
            const messageArea = document.getElementById('message-area');
            messageArea.innerHTML = \`<div class="\${type}">\${message}</div>\`;
            setTimeout(() => {
                messageArea.innerHTML = '';
            }, 5000);
        }
        
        // Make functions globally available
        window.removeSize = removeSize;
    </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard error', details: error.message });
  }
}