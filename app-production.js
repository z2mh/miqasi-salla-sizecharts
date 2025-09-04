// Production App for app.trynashr.com
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Environment variables
const {
  SALLA_OAUTH_CLIENT_ID,
  SALLA_OAUTH_CLIENT_SECRET,
  SALLA_OAUTH_CLIENT_REDIRECT_URI,
  SALLA_WEBHOOK_SECRET,
} = process.env;

// Import Salla APIs
const SallaAPIFactory = require("@salla.sa/passport-strategy");

// Initialize Salla API
const SallaAPI = new SallaAPIFactory({
  clientID: SALLA_OAUTH_CLIENT_ID,
  clientSecret: SALLA_OAUTH_CLIENT_SECRET,
  callbackURL: SALLA_OAUTH_CLIENT_REDIRECT_URI,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'miqasi-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// In-memory storage for demo (use database in production)
const storeData = new Map(); // storeId -> { tokens, products, charts }
const sizeCharts = new Map(); // storeId:productId -> chart data

// ===== AUTHENTICATION ROUTES =====

// OAuth login
app.get('/auth/salla', passport.authenticate('salla'));

// OAuth callback
app.get('/oauth/callback', 
  passport.authenticate('salla', { failureRedirect: '/error' }),
  async (req, res) => {
    try {
      // Store user data
      const store = req.user;
      storeData.set(store.id, {
        ...store,
        tokens: {
          access_token: store.access_token,
          refresh_token: store.refresh_token
        },
        products: [],
        charts: {}
      });
      
      console.log(`✅ Store ${store.id} authenticated successfully`);
      
      // Redirect to dashboard
      res.redirect(`/dashboard?store_id=${store.id}&store_name=${encodeURIComponent(store.name || 'Store')}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/error');
    }
  }
);

// ===== MAIN ROUTES =====

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// Error page
app.get('/error', (req, res) => {
  res.send(`
    <html>
      <head><title>Authentication Error</title></head>
      <body>
        <h1>❌ Authentication Error</h1>
        <p>There was an error authenticating with Salla. Please try again.</p>
        <a href="/auth/salla">Try Again</a>
      </body>
    </html>
  `);
});

// ===== API ROUTES =====

// Get store products
app.get('/api/products/:store_id', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const store = storeData.get(storeId);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Try to fetch real products from Salla API
    try {
      const sallaApi = new SallaAPIFactory({
        clientID: SALLA_OAUTH_CLIENT_ID,
        clientSecret: SALLA_OAUTH_CLIENT_SECRET,
      });
      
      // Set the access token
      sallaApi.setAccessToken(store.tokens.access_token);
      
      // Fetch products
      const response = await sallaApi.request({
        method: 'GET',
        url: 'https://api.salla.dev/admin/v2/products'
      });
      
      if (response.data && response.data.data) {
        const products = response.data.data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price?.amount || '0.00',
          currency: product.price?.currency || 'SAR',
          url: product.url || `https://${store.domain}/product/${product.id}`,
          image: product.images?.[0]?.url
        }));
        
        // Cache products
        store.products = products;
        storeData.set(storeId, store);
        
        return res.json(products);
      }
    } catch (apiError) {
      console.log('Salla API error, using mock data:', apiError.message);
    }
    
    // Fallback to mock data
    const mockProducts = [
      { id: 1, name: "تيشيرت قطني كلاسيكي", price: "75.00", currency: "SAR", url: `https://${store.domain || 'demo'}.salla.sa/product/1` },
      { id: 2, name: "بنطلون جينز أزرق", price: "120.00", currency: "SAR", url: `https://${store.domain || 'demo'}.salla.sa/product/2` },
      { id: 3, name: "فستان صيفي أنيق", price: "95.00", currency: "SAR", url: `https://${store.domain || 'demo'}.salla.sa/product/3` },
      { id: 4, name: "جاكيت شتوي", price: "180.00", currency: "SAR", url: `https://${store.domain || 'demo'}.salla.sa/product/4` },
      { id: 5, name: "حقيبة يد جلدية", price: "200.00", currency: "SAR", url: `https://${store.domain || 'demo'}.salla.sa/product/5` },
    ];
    
    res.json(mockProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Save size chart
app.post('/api/charts/:store_id/:product_id', (req, res) => {
  try {
    const { store_id, product_id } = req.params;
    const chartData = req.body;
    
    const chartKey = `${store_id}:${product_id}`;
    const chart = {
      storeId: store_id,
      productId: product_id,
      productName: chartData.productName,
      productUrl: chartData.productUrl,
      sizes: chartData.sizes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    sizeCharts.set(chartKey, chart);
    
    console.log(`✅ Size chart saved for store ${store_id}, product ${product_id}`);
    
    res.json({
      success: true,
      message: 'Size chart saved successfully',
      chart: chart
    });
  } catch (error) {
    console.error('Error saving size chart:', error);
    res.status(500).json({ error: 'Failed to save size chart' });
  }
});

// Get size chart
app.get('/api/chart/:store_id/:product_id', (req, res) => {
  try {
    const { store_id, product_id } = req.params;
    const chartKey = `${store_id}:${product_id}`;
    
    const chart = sizeCharts.get(chartKey);
    
    if (!chart) {
      return res.status(404).json({ error: 'Size chart not found' });
    }
    
    res.json(chart);
  } catch (error) {
    console.error('Error fetching size chart:', error);
    res.status(500).json({ error: 'Failed to fetch size chart' });
  }
});

// Get all charts for a store
app.get('/api/charts/:store_id', (req, res) => {
  try {
    const storeId = req.params.store_id;
    const storeCharts = [];
    
    for (const [key, chart] of sizeCharts.entries()) {
      if (chart.storeId === storeId) {
        storeCharts.push(chart);
      }
    }
    
    res.json(storeCharts);
  } catch (error) {
    console.error('Error fetching store charts:', error);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
});

// Delete size chart
app.delete('/api/chart/:store_id/:product_id', (req, res) => {
  try {
    const { store_id, product_id } = req.params;
    const chartKey = `${store_id}:${product_id}`;
    
    if (sizeCharts.has(chartKey)) {
      sizeCharts.delete(chartKey);
      res.json({ success: true, message: 'Size chart deleted successfully' });
    } else {
      res.status(404).json({ error: 'Size chart not found' });
    }
  } catch (error) {
    console.error('Error deleting size chart:', error);
    res.status(500).json({ error: 'Failed to delete size chart' });
  }
});

// Size recommendation API
app.post('/api/recommend/:store_id/:product_id', (req, res) => {
  try {
    const { store_id, product_id } = req.params;
    const { height, weight, fit = 'regular' } = req.body;
    
    const chartKey = `${store_id}:${product_id}`;
    const chart = sizeCharts.get(chartKey);
    
    if (!chart) {
      return res.status(404).json({ error: 'Size chart not found' });
    }
    
    // Calculate recommendation
    const recommendation = calculateSizeRecommendation(chart, height, weight, fit);
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error calculating recommendation:', error);
    res.status(500).json({ error: 'Failed to calculate recommendation' });
  }
});

// ===== WEBHOOK ROUTES =====

// App installation webhook
app.post('/webhook/install', (req, res) => {
  try {
    const { merchant, event } = req.body;
    console.log(`📦 App installed for merchant: ${merchant.id}`);
    
    // Initialize store data
    storeData.set(merchant.id, {
      id: merchant.id,
      name: merchant.name,
      domain: merchant.domain,
      installedAt: new Date().toISOString(),
      products: [],
      charts: {}
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Installation webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// App uninstallation webhook
app.post('/webhook/uninstall', (req, res) => {
  try {
    const { merchant } = req.body;
    console.log(`🗑️ App uninstalled for merchant: ${merchant.id}`);
    
    // Clean up store data
    storeData.delete(merchant.id);
    
    // Clean up size charts
    for (const [key, chart] of sizeCharts.entries()) {
      if (chart.storeId === merchant.id) {
        sizeCharts.delete(key);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Uninstallation webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ===== WIDGET ROUTES =====

// Widget script
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.sendFile(path.join(__dirname, 'public/store-widget.js'));
});

// ===== UTILITY FUNCTIONS =====

function calculateSizeRecommendation(chart, height, weight, fit) {
  // Enhanced recommendation algorithm
  const estimatedChest = Math.round(height * 0.52 + weight * 0.25);
  const estimatedWaist = Math.round(height * 0.42 + weight * 0.35);
  
  // Fit adjustments
  const adjustments = {
    tight: -3,
    regular: 0,
    loose: 3
  };
  
  const targetChest = estimatedChest + adjustments[fit];
  const targetWaist = estimatedWaist + adjustments[fit];
  
  // Find best matching size
  let bestMatch = null;
  let minDifference = Infinity;
  
  Object.entries(chart.sizes).forEach(([size, measurements]) => {
    if (measurements.chest && measurements.waist) {
      const chestDiff = Math.abs(measurements.chest - targetChest);
      const waistDiff = Math.abs(measurements.waist - targetWaist);
      const totalDiff = chestDiff + waistDiff;
      
      if (totalDiff < minDifference) {
        minDifference = totalDiff;
        bestMatch = {
          size,
          measurements,
          difference: totalDiff,
          chestDiff,
          waistDiff
        };
      }
    }
  });
  
  // Calculate confidence score
  const baseConfidence = 95;
  const confidencePenalty = Math.min(35, minDifference * 2);
  const confidence = Math.max(60, baseConfidence - confidencePenalty);
  
  return {
    recommendedSize: bestMatch?.size,
    confidence: Math.round(confidence),
    estimatedMeasurements: {
      chest: estimatedChest,
      waist: estimatedWaist
    },
    targetMeasurements: {
      chest: targetChest,
      waist: targetWaist
    },
    bestMatch: bestMatch?.measurements,
    explanation: {
      ar: `بناءً على طولك (${height} سم) ووزنك (${weight} كجم)، نقدر مقاسات جسمك: الصدر ${estimatedChest} سم، الخصر ${estimatedWaist} سم.`,
      en: `Based on your height (${height} cm) and weight (${weight} kg), we estimate your measurements: chest ${estimatedChest} cm, waist ${estimatedWaist} cm.`
    }
  };
}

// ===== STATIC ROUTES =====

// Root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Miqasi - Size Charts for Salla</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;">
        <h1>📏 Miqasi - Intelligent Size Charts</h1>
        <p>Professional size chart solution for Salla stores</p>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>For Store Owners:</h3>
          <p>Install our app from Salla App Store to create intelligent size charts</p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Features:</h3>
          <ul style="text-align: left; display: inline-block;">
            <li>Easy size chart creation</li>
            <li>AI-powered size recommendations</li>
            <li>Automatic integration with your store</li>
            <li>Arabic & English support</li>
            <li>Mobile-optimized interface</li>
          </ul>
        </div>
        <p>© 2024 Miqasi - Powered by TryNashr.com</p>
      </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Miqasi Size Charts',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start server (only if not in Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Miqasi app is running on port ${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
    console.log(`🔗 OAuth: http://localhost:${port}/auth/salla`);
    console.log(`🌐 Widget: http://localhost:${port}/widget.js`);
  });
}

// Export for Vercel
module.exports = app;