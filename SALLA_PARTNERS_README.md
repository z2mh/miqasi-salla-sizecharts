# 📏 Miqasi - Size Charts & Smart Recommendations

## App Description

**Miqasi** is a professional Salla Partners app that enables store owners to create detailed size charts and provide intelligent size recommendations to their customers. The app seamlessly integrates with Salla stores and themes to enhance the shopping experience and reduce returns.

### Key Features

- ✅ **Easy Size Chart Creation** - Create professional size charts directly in Salla Partners dashboard
- ✅ **Smart Size Recommendations** - AI-powered recommendations based on customer height and weight
- ✅ **Native Salla Integration** - Works with Salla's theme system and components
- ✅ **Arabic & English Support** - Full RTL support and bilingual interface
- ✅ **Mobile Optimized** - Perfect experience on all devices
- ✅ **Analytics Ready** - Track usage and recommendation accuracy

## 🚀 How It Works

### For Store Owners:

1. **Install the App** from Salla App Store
2. **Access Settings** through Salla Partners dashboard
3. **Select Products** from dropdown list
4. **Create Size Charts** with measurements (chest, waist, length)
5. **Save & Sync** - Charts automatically appear on product pages

### For Customers:

1. **See "Size Guide" Button** on product pages
2. **View Size Chart** with detailed measurements
3. **Get Smart Recommendations** by entering height and weight
4. **Choose Perfect Size** with confidence

## 📱 App Structure

### Settings Page (`/salla/settings`)
- **Product Selection** - Choose products to add size charts
- **Size Chart Editor** - Interactive table for measurements
- **Real-time Preview** - See how customers will view the chart
- **Auto-save** - Changes sync immediately with store

### Theme Integration (`/salla-theme-component.js`)
- **Auto-detection** - Finds products with size charts
- **Native Components** - Uses `<salla-product-size-guide>` when available
- **Custom Fallback** - Beautiful popup modal for all themes
- **Event Integration** - Works with Salla's event system

### API Endpoints

#### Store Management
- `GET /api/salla/products` - Get store products
- `POST /api/salla/save-chart` - Save size chart
- `GET /api/salla/chart/:merchant_id/:product_id` - Get chart data

#### Customer Features
- `POST /api/recommend` - Get size recommendation
- `GET /api/chart-exists/:merchant_id/:product_id` - Check if chart exists

#### Webhooks
- `POST /hooks/after-install` - Handle app installation
- `POST /hooks/after-uninstall` - Clean up app data

## 🛠️ Technical Integration

### Salla Partners App Configuration

```json
{
  "app": {
    "name": "Miqasi - Size Charts & Smart Recommendations",
    "version": "1.0.0",
    "webhook_url": "{app_url}/webhook",
    "settings_url": "{app_url}/salla/settings"
  },
  "permissions": {
    "scopes": ["products.read", "products.write", "store.read"]
  },
  "theme_integration": {
    "auto_inject": true,
    "script_url": "{app_url}/salla-theme-component.js"
  }
}
```

### Theme Integration

The app automatically integrates with any Salla theme:

```javascript
// Auto-detects products and adds size guide button
<script src="https://your-app-domain.com/salla-theme-component.js"></script>

// Uses native Salla components when available
<salla-product-size-guide product-id="123"></salla-product-size-guide>

// Fallback to custom modal for older themes
<salla-button onclick="salla.event.dispatch('size-guide::open', productId)">
  📏 Size Guide
</salla-button>
```

## 🎯 Size Recommendation Algorithm

Our smart recommendation system uses:

1. **Body Measurements Estimation** - Height and weight to estimate chest/waist
2. **Chart Matching** - Compare estimated measurements with size chart
3. **Fit Preference** - Adjust for tight/regular/loose fit preferences
4. **Confidence Scoring** - Accuracy percentage based on data quality

```javascript
// Example algorithm
const estimatedChest = 0.5 * height + 0.3 * weight - 10;
const estimatedWaist = 0.4 * height + 0.4 * weight - 15;

// Find best matching size from chart
const bestMatch = findClosestSize(estimatedChest, estimatedWaist, sizeChart);

// Adjust for fit preference
const recommendedSize = adjustForFitPreference(bestMatch, fitPreference);
```

## 📊 Usage Analytics

The app tracks:
- **Widget Impressions** - How many customers see the size guide
- **Chart Views** - Size chart usage per product
- **Recommendations** - Smart recommendation requests
- **Accuracy Feedback** - Customer satisfaction with recommendations

## 🔧 Installation Guide

### For Salla Partners:

1. **Create App** in Salla Partners dashboard
2. **Upload Code** to your server
3. **Configure Settings** using `salla-app-settings.json`
4. **Set Webhook URLs**:
   - Settings: `https://your-domain.com/salla/settings`
   - Install: `https://your-domain.com/hooks/after-install`
   - Uninstall: `https://your-domain.com/hooks/after-uninstall`
5. **Add Theme Integration**:
   - Script URL: `https://your-domain.com/salla-theme-component.js`
   - Auto-inject: `true`

### For Development:

```bash
# Clone repository
git clone https://github.com/your-repo/miqasi-salla-app

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add your Salla app credentials

# Start development server
npm run dev

# Test the app
open http://localhost:8082/salla/settings
```

## 🎨 Customization Options

Store owners can customize:

- **Button Text** - Arabic and English labels
- **Button Colors** - Match store branding
- **Button Position** - Before/after add to cart
- **Modal Theme** - Modern/Classic/Minimal styles
- **Measurement Units** - Metric/Imperial systems
- **Custom CSS** - Advanced styling options

## 📱 Mobile Experience

- **Touch-friendly Interface** - Large buttons and easy navigation
- **Responsive Design** - Perfect on all screen sizes
- **Fast Loading** - Optimized for mobile networks
- **Native Feel** - Integrates seamlessly with Salla mobile themes

## 🔐 Security & Privacy

- **Secure API** - All endpoints protected with authentication
- **Data Privacy** - No personal data stored unnecessarily
- **HTTPS Only** - Encrypted communication
- **Webhook Security** - Signed requests verification

## 📈 Performance

- **Lightweight** - Minimal impact on page load times
- **Cached Data** - Size charts cached for fast access
- **CDN Ready** - Static assets served from CDN
- **Lazy Loading** - Components load on demand

## 🆘 Support

### For Store Owners:
- **Documentation** - Complete setup guide
- **Video Tutorials** - Step-by-step instructions
- **Email Support** - Direct technical support
- **FAQ** - Common questions and solutions

### For Developers:
- **API Documentation** - Complete endpoint reference
- **Code Examples** - Integration samples
- **Webhook Guide** - Event handling documentation
- **Theme Integration** - Customization guide

## 🚀 Deployment Checklist

### Before Submission:
- [ ] App tested on multiple Salla stores
- [ ] All API endpoints documented
- [ ] Security review completed
- [ ] Performance optimization done
- [ ] Mobile testing completed
- [ ] Arabic translation reviewed
- [ ] Webhook handlers tested
- [ ] Error handling implemented

### Production Requirements:
- [ ] SSL certificate installed
- [ ] Database backup configured
- [ ] Monitoring setup
- [ ] Error logging enabled
- [ ] CDN configured for static assets
- [ ] Load balancer if needed

## 📋 App Store Listing

### Title
مقاسي - دليل المقاسات والتوصيات الذكية

### Description (Arabic)
تطبيق احترافي لإنشاء جداول مقاسات تفصيلية وتقديم توصيات ذكية للمقاسات. يساعد عملاءك في اختيار المقاس المناسب ويقلل من عمليات الاستبدال والإرجاع.

المميزات:
• إنشاء جداول مقاسات احترافية
• توصيات ذكية بناءً على الطول والوزن
• تكامل مع جميع قوالب سلة
• دعم كامل للغة العربية
• محسن للهواتف المحمولة

### Description (English)
Professional app for creating detailed size charts and providing intelligent size recommendations. Helps customers choose the right size and reduces returns and exchanges.

Features:
• Create professional size charts
• Smart recommendations based on height and weight  
• Integrates with all Salla themes
• Full Arabic support
• Mobile optimized

### Screenshots Required:
1. Settings dashboard showing product selection
2. Size chart editor interface
3. Customer-facing size guide popup
4. Smart recommendation interface
5. Mobile view of the size guide

### Category
Store Enhancement / Customer Experience

### Pricing Model
- **Free Trial** - 7 days free
- **Basic Plan** - 29 SAR/month (up to 50 products)
- **Pro Plan** - 79 SAR/month (unlimited products + analytics)

## 🎯 Success Metrics

Expected outcomes:
- **Reduced Returns** - 15-30% reduction in size-related returns
- **Increased Confidence** - Higher customer satisfaction
- **Better Conversion** - More completed purchases
- **Enhanced Experience** - Professional store appearance

---

## Contact Information

- **Developer**: Miqasi Team
- **Email**: support@miqasi.com
- **Website**: https://miqasi.com
- **Support**: https://help.miqasi.com

Ready for Salla Partners submission! 🚀