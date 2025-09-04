# 🔧 Salla Partners Setup Guide

## 📋 Required Configuration

### 1. **Salla Partners Dashboard Settings**

Go to [Salla Partners Portal](https://salla.partners) → Your App → Settings:

```
App Name: مقاسي - Miqasi Size Charts
App URL: https://app.trynashr.com
OAuth Redirect URL: https://app.trynashr.com/api/auth
Webhook URL: https://app.trynashr.com/api/webhook
```

### 2. **App Permissions**
Enable these scopes:
- ✅ `settings.read` - Access store settings
- ✅ `products.read` - Read product information  
- ✅ `offline_access` - Long-term access tokens

### 3. **Vercel Environment Variables**
Add in Vercel Dashboard → Settings → Environment Variables:

```
SALLA_OAUTH_CLIENT_ID = bacae535-23fd-4860-839e-1e087c93f8e4
SALLA_OAUTH_CLIENT_SECRET = 1c2f53b28aea459463d2c91a69721449
SALLA_WEBHOOK_SECRET = 8e1fb7a0ea9500dbdf8228d017ba5fbb
```

## 🚀 **Complete User Flow**

### **Store Owner Experience:**
1. **Install App** → Clicks "Install" in Salla App Store
2. **OAuth** → Redirected to Salla for authorization
3. **Dashboard** → Lands on Miqasi dashboard at `app.trynashr.com`
4. **Widget Setup** → Clicks "تفعيل الويدجت" to inject code snippets
5. **Create Charts** → Selects products and creates size charts
6. **Live Widget** → Size guide buttons appear on product pages

### **Customer Experience:**
1. **Browse Products** → Visits product page with size chart
2. **Size Guide** → Clicks "📏 دليل المقاسات" button
3. **Interactive Modal** → Views size table and recommendations
4. **Smart Suggestions** → Gets personalized size recommendations
5. **Confident Purchase** → Makes informed buying decisions

## 📡 **API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth` | GET | OAuth flow and token exchange |
| `/api/webhook` | POST | Handle app install/uninstall webhooks |
| `/api/products` | GET | Fetch store products via Salla API |
| `/api/save-chart` | POST | Save size chart for product |
| `/api/chart/{store}/{product}` | GET | Get size chart data for widget |
| `/api/snippets` | POST/DELETE | Install/remove widget code snippets |
| `/dashboard` | GET | Main dashboard interface |
| `/widget.js` | GET | Widget script for stores |

## 🔧 **Automatic Features**

### **App Installation Webhook:**
When store installs app:
- ✅ Receives webhook at `/api/webhook`  
- ✅ Automatically creates App Snippet
- ✅ Injects widget code into product pages
- ✅ Ready to use immediately

### **App Snippet Code:**
```html
<!-- Auto-injected into product pages -->
<script>
(function() {
  const script = document.createElement('script');
  script.src = 'https://app.trynashr.com/widget.js';
  script.dataset.storeId = '{{store.id}}';
  document.head.appendChild(script);
})();
</script>
```

### **Widget Detection:**
- ✅ Only loads on product pages
- ✅ Checks for existing size charts  
- ✅ Adds size guide buttons automatically
- ✅ Works with all Salla themes

## 📊 **Manual Testing**

### **Test Widget Installation:**
```bash
# Install widget snippet
POST https://app.trynashr.com/api/snippets?access_token=TOKEN&action=create

# Remove widget snippet  
DELETE https://app.trynashr.com/api/snippets?access_token=TOKEN&action=remove

# List all snippets
GET https://app.trynashr.com/api/snippets?access_token=TOKEN&action=list
```

### **Test Size Chart API:**
```bash
# Save size chart
POST https://app.trynashr.com/api/save-chart
{
  "store_id": "123",
  "product_id": "456", 
  "chart_data": {"S": {"chest": 90, "waist": 80}},
  "unit": "cm"
}

# Get size chart for widget
GET https://app.trynashr.com/api/chart/123/456
```

## 🎯 **Ready for Submission!**

Your Miqasi app is now **production-ready** with:
- ✅ Complete OAuth integration
- ✅ Automatic widget installation
- ✅ Product management dashboard
- ✅ Customer-facing size recommendations  
- ✅ Arabic RTL interface
- ✅ Mobile responsive design
- ✅ Theme compatibility

**Submit to Salla Partners marketplace for approval! 🚀**