// Vercel serverless function entry point
require("dotenv").config({ path: '../.env' });
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

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
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'miqasi-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// In-memory storage for demo
const storeData = new Map();
const sizeCharts = new Map();

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Miqasi - Intelligent Size Charts for Salla",
    status: "active",
    version: "1.0.0",
    endpoints: {
      dashboard: "/dashboard",
      auth: "/auth/salla", 
      widget: "/widget.js",
      health: "/health"
    }
  });
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
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

// Widget script
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, '../public/store-widget.js'));
});

// OAuth routes
app.get('/auth/salla', passport.authenticate('salla'));

// OAuth callback
app.get('/oauth/callback', 
  passport.authenticate('salla', { failureRedirect: '/error' }),
  async (req, res) => {
    try {
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
      
      res.redirect(`/dashboard?store_id=${store.id}&store_name=${encodeURIComponent(store.name || 'Store')}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/error');
    }
  }
);

// Error page
app.get('/error', (req, res) => {
  res.json({
    error: 'Authentication Error',
    message: 'There was an error authenticating with Salla. Please try again.',
    retry: '/auth/salla'
  });
});

// API Routes
app.get('/api/products/:store_id', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    
    // Mock products for demo
    const mockProducts = [
      { id: 1, name: "تيشيرت قطني كلاسيكي", price: "75.00", currency: "SAR", url: `https://demo.salla.sa/product/1` },
      { id: 2, name: "بنطلون جينز أزرق", price: "120.00", currency: "SAR", url: `https://demo.salla.sa/product/2` },
      { id: 3, name: "فستان صيفي أنيق", price: "95.00", currency: "SAR", url: `https://demo.salla.sa/product/3` },
      { id: 4, name: "جاكيت شتوي", price: "180.00", currency: "SAR", url: `https://demo.salla.sa/product/4` },
      { id: 5, name: "حقيبة يد جلدية", price: "200.00", currency: "SAR", url: `https://demo.salla.sa/product/5` },
    ];
    
    res.json(mockProducts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

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
    
    res.json({
      success: true,
      message: 'Size chart saved successfully',
      chart: chart
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save size chart' });
  }
});

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
    res.status(500).json({ error: 'Failed to fetch size chart' });
  }
});

module.exports = app;