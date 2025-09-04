// Root entry point for Vercel
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Miqasi - Intelligent Size Charts for Salla",
    status: "active",
    version: "1.0.0",
    endpoints: {
      dashboard: "/dashboard",
      health: "/health",
      widget: "/widget.js"
    }
  });
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

// Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// Widget
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public/store-widget.js'));
});

// Products API
app.get('/api/products/:store_id', (req, res) => {
  const mockProducts = [
    { id: 1, name: "تيشيرت قطني كلاسيكي", price: "75.00", currency: "SAR" },
    { id: 2, name: "بنطلون جينز أزرق", price: "120.00", currency: "SAR" },
    { id: 3, name: "فستان صيفي أنيق", price: "95.00", currency: "SAR" }
  ];
  res.json(mockProducts);
});

module.exports = app;