# 🚀 Miqasi Deployment Guide for app.trynashr.com

## 📦 What We've Built

### ✅ Complete Salla Partners App:
- **Dashboard**: Professional interface for store owners (`dashboard.html`)
- **OAuth Integration**: Secure authentication with Salla (`app-production.js`)
- **Store Widget**: Automatic size guide injection (`public/store-widget.js`)
- **API Endpoints**: Full backend for charts and recommendations
- **Arabic Interface**: RTL support and Arabic text throughout

### 🎯 User Flow:
1. Store owner installs app from Salla App Store
2. OAuth redirect to `app.trynashr.com/dashboard`
3. Select products from dropdown (synced from Salla API)
4. Create size charts with table editor
5. Size guide automatically appears on product pages
6. Customers get AI recommendations based on height/weight

## 📁 Files to Deploy:

```
/app.trynashr.com/
├── app-production.js          # Main server file
├── dashboard.html             # Store owner dashboard
├── package.json               # Dependencies
├── .env.production           # Environment variables
├── public/
│   └── store-widget.js       # Customer-facing widget
└── static files...
```

## 🔧 Deployment Steps:

### 1. Upload Files to app.trynashr.com

Upload these files to your server:
- `app-production.js`
- `dashboard.html` 
- `public/store-widget.js`
- `package.json`
- `.env.production`

### 2. Install Dependencies

```bash
ssh your-server
cd /path/to/app.trynashr.com
npm install
```

### 3. Configure Environment Variables

Edit `.env.production` with your Salla credentials:

```env
SALLA_OAUTH_CLIENT_ID=your_client_id
SALLA_OAUTH_CLIENT_SECRET=your_client_secret  
SALLA_OAUTH_CLIENT_REDIRECT_URI=https://app.trynashr.com/oauth/callback
SALLA_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Start the App

```bash
# Production mode
npm run production

# Or with PM2 (recommended)
pm2 start app-production.js --name miqasi-app
pm2 save
pm2 startup
```

### 5. Configure Salla Partners Dashboard

In your Salla Partners dashboard:

**OAuth Settings:**
- Client ID: [from your Salla app]
- Client Secret: [from your Salla app] 
- Redirect URI: `https://app.trynashr.com/oauth/callback`

**App Settings:**
- Settings URL: `https://app.trynashr.com/dashboard`
- Webhook URL: `https://app.trynashr.com/webhook/install`

**Theme Integration:**
- Widget Script: `https://app.trynashr.com/widget.js`
- Auto-inject: `true`
- Position: `after_price`

### 6. App Snippet Configuration

In Salla Partners dashboard, register this App Snippet:

```json
{
  "target": "product",
  "position": "after_price", 
  "src": "https://app.trynashr.com/widget.js",
  "name": "Miqasi Size Guide",
  "active": true
}
```

This automatically injects the size guide button on all product pages.

## 🧪 Testing the Complete Flow:

### 1. Test OAuth:
Visit: `https://app.trynashr.com/auth/salla`

### 2. Test Dashboard:
After OAuth: `https://app.trynashr.com/dashboard?store_id=123`

### 3. Test API:
```bash
curl https://app.trynashr.com/api/products/123
curl https://app.trynashr.com/api/chart/123/456
```

### 4. Test Widget:
Visit any product page on a store with the app installed.
Should see "📏 دليل المقاسات" button.

## 🎯 Key API Endpoints:

```
GET  /auth/salla                    # OAuth login
GET  /oauth/callback               # OAuth callback  
GET  /dashboard                    # Store owner dashboard
GET  /widget.js                    # Customer widget
GET  /api/products/:store_id       # Get store products
POST /api/charts/:store/:product   # Save size chart
GET  /api/chart/:store/:product    # Get size chart
POST /api/recommend/:store/:product # Get size recommendation
POST /webhook/install              # Installation webhook
POST /webhook/uninstall            # Uninstallation webhook
```

## 🔐 Security Checklist:

- [x] Environment variables secured
- [x] HTTPS enforced
- [x] Session security configured  
- [x] Webhook signature verification
- [x] Input validation on all endpoints
- [x] CORS properly configured

## 📱 Mobile Compatibility:

- [x] Responsive dashboard design
- [x] Touch-friendly size chart editor
- [x] Mobile-optimized widget modal
- [x] Arabic RTL support
- [x] Fast loading on mobile networks

## 🎨 Customization Options:

Store owners can customize:
- Button text (Arabic/English)
- Button colors and position  
- Modal theme and styling
- Measurement units (metric/imperial)
- Fit preferences (tight/regular/loose)

## 📊 Analytics Ready:

The app tracks:
- Widget impressions
- Chart views per product
- Recommendation requests
- Customer satisfaction scores

## 🆘 Support & Maintenance:

### Logs Location:
```bash
pm2 logs miqasi-app
tail -f /var/log/miqasi/app.log
```

### Common Issues:
1. **OAuth fails**: Check redirect URI exact match
2. **Widget not showing**: Verify App Snippet configuration
3. **Products not loading**: Check Salla API permissions
4. **Charts not saving**: Check database/storage permissions

### Monitoring:
- Health check: `https://app.trynashr.com/health`
- Server status: `pm2 status`
- Error logs: `pm2 logs --error`

## 🎉 Go Live Checklist:

- [ ] Upload all files to app.trynashr.com
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Start production server
- [ ] Configure Salla Partners dashboard
- [ ] Register App Snippet
- [ ] Test complete user flow
- [ ] Submit app for Salla approval

## 📞 Support:

For technical support:
- Email: support@trynashr.com
- GitHub: [Repository URL]
- Documentation: https://app.trynashr.com/docs

---

**Your complete Salla Partners App is ready for deployment!** 🚀

The app provides:
✅ Professional dashboard for store owners
✅ Intelligent size recommendations for customers  
✅ Automatic integration with any Salla theme
✅ Arabic/English bilingual support
✅ Mobile-optimized experience
✅ Real-time product synchronization