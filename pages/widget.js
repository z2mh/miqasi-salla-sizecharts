import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const { product, store } = req.query;
    
    if (!product || !store) {
      return res.status(400).send('Missing product or store parameter');
    }

    console.log('Widget popup requested for:', { store, product });

    // Get size chart data
    const chartKey = `sizechart:${store}:${product}`;
    const chartData = await kv.get(chartKey);

    if (!chartData) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Size Guide - Miqasi</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
            .container { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>📏 دليل المقاسات</h2>
            <p>عذراً، لم يتم العثور على دليل المقاسات لهذا المنتج.</p>
            <button onclick="window.close()" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">إغلاق</button>
          </div>
        </body>
        </html>
      `);
    }

    // Parse chart data if it's a string
    const data = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
    
    // Build size table rows
    let sizeRows = '';
    const sizes = Object.keys(data.sizes || {}).sort();
    sizes.forEach(size => {
      const measurements = data.sizes[size];
      sizeRows += `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; background: #f8f9ff; text-align: center;">${size}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${measurements.chest || '-'} سم</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${measurements.waist || '-'} سم</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${measurements.length || '-'} سم</td>
        </tr>
      `;
    });

    // Return complete HTML popup
    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>دليل المقاسات - Miqasi</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
          }
          h1 {
            color: #333;
            font-size: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          }
          .close-btn:hover {
            background: #f0f0f0;
          }
          .table-container {
            overflow-x: auto;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            text-align: center;
            font-weight: 600;
            font-size: 16px;
          }
          td {
            padding: 12px;
            border: 1px solid #e0e0e0;
            text-align: center;
            font-size: 14px;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          tr:hover {
            background: #f0f8ff;
            transform: scale(1.01);
            transition: all 0.2s;
          }
          .note {
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            padding: 20px;
            border-radius: 12px;
            font-size: 14px;
            color: #555;
            text-align: center;
            line-height: 1.6;
            border-right: 4px solid #667eea;
          }
          .note strong {
            color: #333;
          }
          .emoji {
            font-size: 20px;
            margin-left: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>
              <span class="emoji">📏</span>
              دليل المقاسات
            </h1>
            <button class="close-btn" onclick="window.close()" title="إغلاق">✕</button>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>المقاس</th>
                  <th>الصدر (سم)</th>
                  <th>الخصر (سم)</th>
                  <th>الطول (سم)</th>
                </tr>
              </thead>
              <tbody>
                ${sizeRows}
              </tbody>
            </table>
          </div>
          
          <div class="note">
            <strong>💡 ملاحظة مهمة:</strong> جميع القياسات بالسنتيمتر. للحصول على أفضل النتائج، قم بقياس الجسم مباشرة باستخدام شريط القياس.
          </div>
        </div>
        
        <script>
          // Close on Escape key
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              window.close();
            }
          });
          
          // Focus management
          document.querySelector('.close-btn').focus();
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Widget popup error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="text-align: center; padding: 50px; font-family: Arial;">
        <h2>خطأ في تحميل دليل المقاسات</h2>
        <p>حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.</p>
        <button onclick="window.close()" style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">إغلاق</button>
      </body>
      </html>
    `);
  }
}