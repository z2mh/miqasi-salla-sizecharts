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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255,255,255,0.95);
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .feature strong { color: #667eea; }
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            border-color: #667eea;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            background: #667eea;
            color: white;
        }
        .loading {
            text-align: center;
            color: #666;
            padding: 20px;
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
        
        <div class="card">
            <h2>🔧 إعداد الويدجت</h2>
            <p>قم بتفعيل الويدجت في متجرك لعرض أزرار دليل المقاسات تلقائياً:</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <button class="btn" id="install-snippet-btn">📦 تفعيل الويدجت</button>
                <button class="btn" id="remove-snippet-btn" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">🗑️ إزالة الويدجت</button>
            </div>
            
            <div id="snippet-status"></div>
        </div>
        
        <div class="card" id="chart-editor" style="display: none;">
            <h2>📏 إنشاء جدول المقاسات</h2>
            <div id="message-area"></div>
            
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
        document.getElementById('install-snippet-btn').addEventListener('click', installSnippet);
        document.getElementById('remove-snippet-btn').addEventListener('click', removeSnippet);
        
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
                const response = await fetch(\`\${API_BASE}/api/get-chart?store_id=\${STORE_ID}&product_id=\${productId}\`);
                const data = await response.json();
                
                if (data.success && data.data.sizes) {
                    sizeData = data.data.sizes;
                    showMessage(\`📊 تم تحميل جدول المقاسات الموجود (\${Object.keys(sizeData).length} مقاسات)\`, 'success');
                } else {
                    sizeData = {};
                    showMessage('💡 لا يوجد جدول مقاسات لهذا المنتج - يمكنك إنشاء واحد جديد', 'success');
                }
            } catch (error) {
                console.log('No existing chart found or error loading:', error);
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
        
        function removeSize(sizeName) {
            if (confirm(\`هل تريد حذف المقاس \${sizeName}؟\`)) {
                delete sizeData[sizeName];
                updateSizesTable();
                showMessage('تم حذف المقاس', 'success');
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
                const response = await fetch(\`\${API_BASE}/api/save-chart\`, {
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
                console.error('Save error:', error);
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
        
        // Snippet management functions
        async function installSnippet() {
            const statusDiv = document.getElementById('snippet-status');
            statusDiv.innerHTML = '<div style="color: #666;">جاري تثبيت الويدجت...</div>';
            
            try {
                const response = await fetch(\`\${API_BASE}/api/snippets?access_token=\${ACCESS_TOKEN}&action=create\`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    statusDiv.innerHTML = '<div class="success">✅ تم تفعيل الويدجت بنجاح! سيظهر الآن في جميع صفحات المنتجات.</div>';
                } else {
                    statusDiv.innerHTML = \`<div class="error">❌ خطأ في تفعيل الويدجت: \${data.error}</div>\`;
                }
            } catch (error) {
                console.error('Install snippet error:', error);
                statusDiv.innerHTML = '<div class="error">❌ خطأ في الاتصال بالخادم</div>';
            }
        }
        
        async function removeSnippet() {
            if (!confirm('هل تريد إزالة الويدجت من المتجر؟')) {
                return;
            }
            
            const statusDiv = document.getElementById('snippet-status');
            statusDiv.innerHTML = '<div style="color: #666;">جاري إزالة الويدجت...</div>';
            
            try {
                const response = await fetch(\`\${API_BASE}/api/snippets?access_token=\${ACCESS_TOKEN}&action=remove\`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    statusDiv.innerHTML = '<div class="success">✅ تم إزالة الويدجت بنجاح.</div>';
                } else {
                    statusDiv.innerHTML = \`<div class="error">❌ خطأ في إزالة الويدجت: \${data.error}</div>\`;
                }
            } catch (error) {
                console.error('Remove snippet error:', error);
                statusDiv.innerHTML = '<div class="error">❌ خطأ في الاتصال بالخادم</div>';
            }
        }
        
        // Make functions globally available
        window.removeSize = removeSize;
        window.installSnippet = installSnippet;
        window.removeSnippet = removeSnippet;
    </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard error', details: error.message });
  }
}