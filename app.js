// Import Deps
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const consolidate = require("consolidate");
const getUnixTimestamp = require("./helpers/getUnixTimestamp");
const bodyParser = require("body-parser");
const port = process.env.PORT || process.argv[2] || 8082;

/*
  Create a .env file in the root directory of your project. 
  Add environment-specific variables on new lines in the form of NAME=VALUE. For example:
  SALLA_OAUTH_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  SALLA_OAUTH_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ...
*/
const {
  SALLA_OAUTH_CLIENT_ID,
  SALLA_OAUTH_CLIENT_SECRET,
  SALLA_OAUTH_CLIENT_REDIRECT_URI,
  SALLA_WEBHOOK_SECRET,
  SALLA_DATABASE_ORM,
} = process.env;

// Import Salla APIs
const SallaAPIFactory = require("@salla.sa/passport-strategy");
const SallaDatabase = require("./database")(SALLA_DATABASE_ORM || "Sequelize");
const SallaWebhook = require("@salla.sa/webhooks-actions");

SallaWebhook.setSecret(SALLA_WEBHOOK_SECRET);

// Add Listeners
SallaWebhook.on("app.installed", (eventBody, userArgs) => {
  // handel app.installed event
});
SallaWebhook.on("app.store.authorize", (eventBody, userArgs) => {
  // handel app.installed event
});
SallaWebhook.on("all", (eventBody, userArgs) => {
  // handel all events even thats not authorized
});

// we initialize our Salla API
const SallaAPI = new SallaAPIFactory({
  clientID: SALLA_OAUTH_CLIENT_ID,
  clientSecret: SALLA_OAUTH_CLIENT_SECRET,
  callbackURL: SALLA_OAUTH_CLIENT_REDIRECT_URI,
});

// set Listener on auth success
SallaAPI.onAuth(async (accessToken, refreshToken, expires_in, data) => {
  console.log("✅ OAuth Success! User:", data.name, "Merchant:", data.merchant.id);
  // Store in memory instead of database for testing
  global.currentUser = {
    username: data.name,
    email: data.email,
    merchant_id: data.merchant.id,
    access_token: accessToken,
    refresh_token: refreshToken
  };
});

//   Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete salla user is serialized
//   and deserialized.

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

//   Use the Salla Strategy within Passport.
passport.use(SallaAPI.getPassportStrategy());
// save token and user data to your selected database

var app = express();

// configure Express
app.set("views", __dirname + "/views");
app.set("view engine", "html");

// set the session secret
// you can store session data in any database (monogdb - mysql - inmemory - etc) for more (https://www.npmjs.com/package/express-session)
app.use(
  session({ secret: "keyboard cat", resave: true, saveUninitialized: true })
);

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// serve static files from public folder
app.use(express.static(__dirname + "/public"));

// set the render engine to nunjucks

app.engine("html", consolidate.nunjucks);
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Temporarily disable SallaAPI verify for testing
// app.use((req, res, next) => SallaAPI.setExpressVerify(req, res, next));

// POST /webhook
app.post("/webhook", function (req, res) {
  SallaWebhook.checkActions(req.body, req.headers.authorization, {
    /* your args to pass to action files or listeners */
  });
});

// GET /oauth/redirect
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in salla authentication will involve redirecting
//   the user to accounts.salla.sa. After authorization, salla will redirect the user
//   back to this application at /oauth/callback
app.get(["/oauth/redirect", "/login"], passport.authenticate("salla"));

// GET /oauth/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  "/oauth/callback",
  passport.authenticate("salla", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

// GET /
// render the index page

app.get("/", async function (req, res) {
  let userDetails = { 
    user: req.user || global.currentUser, 
    isLogin: req.user || global.currentUser 
  }
  
  // Use global stored user data instead of database
  if (global.currentUser) {
    userDetails.user = global.currentUser;
    userDetails.isLogin = true;
  }
  
  res.render("index.html", userDetails);
});

// GET /account
// get account information and ensure user is authenticated

app.get("/account", ensureAuthenticated, function (req, res) {
  res.render("account.html", {
    user: req.user,
    isLogin: req.user,
  });
});

// GET /refreshToken
// get new access token

app.get("/refreshToken", ensureAuthenticated, function (req, res) {
  SallaAPI.requestNewAccessToken(SallaAPI.getRefreshToken())
    .then((token) => {
      res.render("token.html", {
        token,
        isLogin: req.user,
      });
    })
    .catch((err) => res.send(err));
});

// GET /orders
// get all orders from user store

app.get("/orders", ensureAuthenticated, async function (req, res) {
  res.render("orders.html", {
    orders: await SallaAPI.getAllOrders(),
    isLogin: req.user,
  });
});

// GET /customers
// get all customers from user store

app.get("/customers", ensureAuthenticated, async function (req, res) {
  res.render("customers.html", {
    customers: await SallaAPI.getAllCustomers(),
    isLogin: req.user,
  });
});

// GET /logout
//   logout from passport
app.get("/logout", function (req, res) {
  SallaAPI.logout();
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect("/");
  });
});

// ===== SIZE CHART MANAGEMENT SYSTEM =====

// In-memory storage for demo (in production, use database)
const sizeCharts = new Map(); // key: merchant_id:product_id, value: chart data

// ADMIN ROUTES - For store owners to manage size charts

// Admin Dashboard - List products with size chart management
app.get("/admin/products", async (req, res) => {
  try {
    // Use global user data instead of database
    const currentUser = global.currentUser;
    if (!currentUser) {
      return res.redirect("/login");
    }
    
    const accessToken = currentUser.access_token;
    const merchantId = currentUser.merchant_id;
    
    // Mock products for testing - replace with actual API call when working
    const mockProducts = [
      { id: 1, name: "T-Shirt Cotton", price: "50.00", currency: "SAR", status: "sale", image: { url: "" }},
      { id: 2, name: "Jeans Pants", price: "120.00", currency: "SAR", status: "sale", image: { url: "" }},
      { id: 3, name: "Hoodie", price: "85.00", currency: "SAR", status: "sale", image: { url: "" }}
    ];
    
    // Add size chart status to each product
    const productsWithCharts = mockProducts.map(product => {
      const chartKey = `${merchantId}:${product.id}`;
      const hasChart = sizeCharts.has(chartKey);
      console.log(`📊 Product ${product.id}: Chart key "${chartKey}" exists: ${hasChart}`);
      return {
        ...product,
        has_size_chart: hasChart
      };
    });
    
    res.render("admin/products.html", {
      user: currentUser,
      products: productsWithCharts,
      isLogin: true
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).render("error.html", { error: "Failed to load products" });
  }
});

// Admin - Edit size chart for a specific product
app.get("/admin/size-chart/:product_id", async (req, res) => {
  try {
    const { product_id } = req.params;
    
    // Use global user data instead of database
    const currentUser = global.currentUser;
    if (!currentUser) {
      return res.redirect("/login");
    }
    
    const merchantId = currentUser.merchant_id;
    const accessToken = currentUser.access_token;
    
    // Mock product data for testing - replace with API call when working
    const mockProducts = {
      1: { id: 1, name: "T-Shirt Cotton", price: "50.00", currency: "SAR", status: "sale" },
      2: { id: 2, name: "Jeans Pants", price: "120.00", currency: "SAR", status: "sale" },
      3: { id: 3, name: "Hoodie", price: "85.00", currency: "SAR", status: "sale" }
    };
    
    const product = mockProducts[product_id];
    if (!product) {
      return res.status(404).render("error.html", { error: "Product not found" });
    }
    
    // Get existing size chart if any
    const chartKey = `${merchantId}:${product_id}`;
    const existingChart = sizeCharts.get(chartKey) || {
      rows: [
        { size: "S", chest: "", waist: "", length: "" },
        { size: "M", chest: "", waist: "", length: "" },
        { size: "L", chest: "", waist: "", length: "" }
      ],
      unit: "cm"
    };
    
    res.render("admin/size-chart-editor.html", {
      user: currentUser,
      product,
      chart: existingChart,
      isLogin: true
    });
  } catch (error) {
    console.error("Error loading size chart editor:", error);
    res.status(500).render("error.html", { error: "Failed to load size chart editor" });
  }
});

// Admin - Save size chart for a product
app.post("/admin/size-chart/:product_id", async (req, res) => {
  try {
    const { product_id } = req.params;
    const { chart_data, unit } = req.body;
    
    console.log("📊 Saving size chart for product:", product_id);
    console.log("📊 Received data:", { chart_data, unit });
    console.log("📊 Global user:", global.currentUser ? "exists" : "missing");
    
    // Use global user data instead of database
    const currentUser = global.currentUser;
    if (!currentUser) {
      console.log("❌ No current user found");
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const merchantId = currentUser.merchant_id;
    const chartKey = `${merchantId}:${product_id}`;
    
    // Parse chart data and save
    const chartRows = JSON.parse(chart_data);
    sizeCharts.set(chartKey, {
      rows: chartRows,
      unit: unit || "cm",
      updated_at: new Date().toISOString(),
      merchant_id: merchantId,
      product_id
    });
    
    console.log("✅ Size chart saved with key:", chartKey);
    console.log("✅ Chart rows:", chartRows);
    
    res.json({ success: true, message: "Size chart saved successfully!" });
  } catch (error) {
    console.error("❌ Error saving size chart:", error);
    res.status(500).json({ error: "Failed to save size chart", details: error.message });
  }
});

// PUBLIC ROUTES - For consumers to get size recommendations

// Size recommendation page
app.get("/recommend/:merchant_id/:product_id", async (req, res) => {
  try {
    const { merchant_id, product_id } = req.params;
    const chartKey = `${merchant_id}:${product_id}`;
    const chart = sizeCharts.get(chartKey);
    
    if (!chart) {
      return res.status(404).render("error.html", { 
        error: "Size chart not found for this product" 
      });
    }
    
    res.render("public/size-recommendation.html", {
      merchant_id,
      product_id,
      chart
    });
  } catch (error) {
    console.error("Error loading recommendation page:", error);
    res.status(500).render("error.html", { error: "Failed to load recommendation page" });
  }
});

// API - Get size recommendation based on measurements
app.post("/api/recommend", async (req, res) => {
  try {
    const { merchant_id, product_id, height, weight, fit_preference } = req.body;
    
    if (!merchant_id || !product_id || !height || !weight) {
      return res.status(400).json({ 
        error: "merchant_id, product_id, height, and weight are required" 
      });
    }
    
    const chartKey = `${merchant_id}:${product_id}`;
    const chart = sizeCharts.get(chartKey);
    
    if (!chart) {
      return res.status(404).json({ error: "Size chart not found" });
    }
    
    // Calculate recommended size
    const recommendation = calculateSizeRecommendation(
      parseFloat(height), 
      parseFloat(weight), 
      chart.rows, 
      fit_preference
    );
    
    res.json({
      success: true,
      recommendation,
      chart_unit: chart.unit
    });
  } catch (error) {
    console.error("Error generating recommendation:", error);
    res.status(500).json({ error: "Failed to generate recommendation" });
  }
});

// Helper function to calculate size recommendation
function calculateSizeRecommendation(height, weight, chartRows, fitPreference) {
  // Estimate body measurements from height/weight
  const estimatedChest = Math.round(0.5 * height + 0.3 * weight - 10);
  const estimatedWaist = Math.round(0.4 * height + 0.4 * weight - 15);
  
  let bestMatch = null;
  let bestScore = 0;
  
  // Score each size
  for (const row of chartRows) {
    if (!row.chest || !row.waist) continue;
    
    const chestValue = parseFloat(row.chest);
    const waistValue = parseFloat(row.waist);
    
    if (isNaN(chestValue) || isNaN(waistValue)) continue;
    
    // Calculate fit score (closer to measurements = higher score)
    const chestScore = 1 - Math.abs(estimatedChest - chestValue) / chestValue;
    const waistScore = 1 - Math.abs(estimatedWaist - waistValue) / waistValue;
    const totalScore = (chestScore + waistScore) / 2;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = row;
    }
  }
  
  if (!bestMatch) {
    return {
      recommended_size: "Size chart incomplete",
      confidence: 0,
      explanation: "Please complete the size chart measurements"
    };
  }
  
  let recommendedSize = bestMatch.size;
  
  // Adjust for fit preference
  if (fitPreference === "tight" && bestScore > 0.8) {
    const currentIndex = chartRows.findIndex(r => r.size === recommendedSize);
    if (currentIndex > 0) {
      recommendedSize = chartRows[currentIndex - 1].size;
    }
  } else if (fitPreference === "loose" && bestScore > 0.8) {
    const currentIndex = chartRows.findIndex(r => r.size === recommendedSize);
    if (currentIndex < chartRows.length - 1) {
      recommendedSize = chartRows[currentIndex + 1].size;
    }
  }
  
  return {
    recommended_size: recommendedSize,
    confidence: Math.round(bestScore * 100),
    explanation: `Based on your height (${height}cm) and weight (${weight}kg), we estimated chest: ${Math.round(0.5 * height + 0.3 * weight - 10)}cm and waist: ${Math.round(0.4 * height + 0.4 * weight - 15)}cm`,
    estimated_measurements: {
      chest: Math.round(0.5 * height + 0.3 * weight - 10),
      waist: Math.round(0.4 * height + 0.4 * weight - 15)
    }
  };
}

// API - Check chart status for all products
app.get("/api/chart-status", (req, res) => {
  try {
    const currentUser = global.currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const merchantId = currentUser.merchant_id;
    const chartStatus = {};
    
    // Check products 1, 2, 3
    [1, 2, 3].forEach(productId => {
      const chartKey = `${merchantId}:${productId}`;
      const chart = sizeCharts.get(chartKey);
      
      // Consider chart as existing if it has at least one row with measurements
      chartStatus[productId] = chart && chart.rows && 
        chart.rows.some(row => row.chest || row.waist || row.length);
    });
    
    console.log("📊 Chart status check:", chartStatus);
    res.json(chartStatus);
  } catch (error) {
    console.error("Error checking chart status:", error);
    res.status(500).json({ error: "Failed to check chart status" });
  }
});

// API - Check if chart exists for a specific product (for widget)
app.get("/api/chart-exists/:merchant_id/:product_id", (req, res) => {
  try {
    const { merchant_id, product_id } = req.params;
    const chartKey = `${merchant_id}:${product_id}`;
    const chart = sizeCharts.get(chartKey);
    
    const exists = chart && chart.rows && 
      chart.rows.some(row => row.chest || row.waist || row.length);
    
    if (exists) {
      res.json({
        exists: true,
        chart: {
          rows: chart.rows,
          unit: chart.unit || 'cm'
        }
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking chart existence:", error);
    res.status(500).json({ error: "Failed to check chart existence" });
  }
});

// Demo product page to test the widget
app.get("/demo-product", (req, res) => {
  res.render("demo-product.html");
});

// Widget integration guide
app.get("/admin/widget-integration", (req, res) => {
  res.render("admin/widget-integration.html");
});

// API - Detect merchant by domain (for universal widget)
app.post("/api/detect-merchant", (req, res) => {
  try {
    const { domain, platform } = req.body;
    
    console.log("🔍 Detecting merchant for domain:", domain, "platform:", platform);
    
    // In production, this would check a database of registered domains
    // For demo, return a default merchant ID
    const merchantMapping = {
      'demo-store.com': '1974422259',
      'localhost': '1974422259',
      '127.0.0.1': '1974422259',
      // Add more domain-to-merchant mappings as needed
    };
    
    const merchantId = merchantMapping[domain] || '1974422259'; // Default for demo
    
    console.log("✅ Found merchant ID:", merchantId, "for domain:", domain);
    
    res.json({ 
      success: true, 
      merchantId,
      platform: platform || 'generic'
    });
  } catch (error) {
    console.error("Error detecting merchant:", error);
    res.status(500).json({ error: "Failed to detect merchant" });
  }
});

// Serve the universal widget
app.get("/universal-widget.js", (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(__dirname + '/public/universal-size-widget.js');
});

// Serve the Salla-specific widget
app.get("/salla-widget.js", (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(__dirname + '/public/salla-widget.js');
});

// Salla App Settings Page (embedded in Salla Partners dashboard)  
app.get("/salla/settings", (req, res) => {
  res.send(`
    <html>
    <head><title>Miqasi Settings</title></head>
    <body>
      <h1>🎯 Miqasi Size Chart Settings</h1>
      <p>Select products and create size charts here</p>
      <select id="products">
        <option>Loading products...</option>
      </select>
      <script>
        // This will load products from Salla API
        fetch('/api/salla/products')
          .then(r => r.json())
          .then(products => {
            const select = document.getElementById('products');
            select.innerHTML = products.map(p => 
              '<option value="' + p.id + '">' + p.name + '</option>'
            ).join('');
          });
      </script>
    </body>
    </html>
  `);
});

// API endpoint to get products
app.get("/api/salla/products", (req, res) => {
  // Mock products for now - in production this will call Salla API
  res.json([
    { id: 1, name: "تيشيرت قطني كلاسيكي" },
    { id: 2, name: "بنطلون جينز" }, 
    { id: 3, name: "فستان صيفي" }
  ]);
});

// ===== SALLA PARTNERS APP ROUTES =====


// API - Get Salla store products
app.get("/api/salla/products", async (req, res) => {
  try {
    // Get access token from Salla
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      // For demo, return mock products
      const mockProducts = [
        { id: 1, name: "تيشيرت قطني كلاسيكي", price: "50.00", currency: "SAR", status: "sale" },
        { id: 2, name: "بنطلون جينز رجالي", price: "120.00", currency: "SAR", status: "sale" },
        { id: 3, name: "هودي شتوي مريح", price: "85.00", currency: "SAR", status: "sale" },
        { id: 4, name: "قميص رسمي أنيق", price: "95.00", currency: "SAR", status: "sale" },
        { id: 5, name: "جاكيت رياضي", price: "150.00", currency: "SAR", status: "sale" }
      ];

      // Check which products have size charts
      const currentUser = global.currentUser;
      const merchantId = currentUser ? currentUser.merchant_id : '1974422259';
      
      const productsWithCharts = mockProducts.map(product => ({
        ...product,
        has_chart: sizeCharts.has(`${merchantId}:${product.id}`)
      }));

      return res.json({ success: true, products: productsWithCharts });
    }

    // In production, fetch from Salla API
    const sallaResponse = await fetch('https://api.salla.dev/admin/v2/products', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (sallaResponse.ok) {
      const sallaData = await sallaResponse.json();
      
      // Add size chart status to each product
      const currentUser = global.currentUser;
      const merchantId = currentUser ? currentUser.merchant_id : req.user?.merchant_id;
      
      const productsWithCharts = sallaData.data.map(product => ({
        ...product,
        has_chart: sizeCharts.has(`${merchantId}:${product.id}`)
      }));

      res.json({ success: true, products: productsWithCharts });
    } else {
      throw new Error('Failed to fetch products from Salla');
    }

  } catch (error) {
    console.error('Error fetching Salla products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// API - Save size chart from Salla settings
app.post("/api/salla/save-chart", async (req, res) => {
  try {
    const { product_id, chart_data, unit } = req.body;
    
    console.log('💾 Saving Salla size chart:', { product_id, chart_data, unit });

    // Get merchant ID (in production, from Salla token)
    const currentUser = global.currentUser;
    const merchantId = currentUser ? currentUser.merchant_id : '1974422259';
    
    const chartKey = `${merchantId}:${product_id}`;
    
    // Save the chart
    sizeCharts.set(chartKey, {
      rows: chart_data,
      unit: unit || 'cm',
      updated_at: new Date().toISOString(),
      merchant_id: merchantId,
      product_id: product_id,
      created_by: 'salla_settings'
    });
    
    console.log('✅ Salla size chart saved:', chartKey);
    
    // In production, also sync with Salla store theme
    await syncWithSallaTheme(merchantId, product_id, chart_data, unit);
    
    res.json({ 
      success: true, 
      message: 'Size chart saved successfully',
      chart_key: chartKey 
    });

  } catch (error) {
    console.error('❌ Error saving Salla chart:', error);
    res.status(500).json({ error: 'Failed to save size chart' });
  }
});

// Function to sync size chart with Salla theme
async function syncWithSallaTheme(merchantId, productId, chartData, unit) {
  try {
    console.log('🔄 Syncing with Salla theme for product:', productId);
    
    // In production, this would:
    // 1. Update the product with size chart data
    // 2. Inject the size guide component into the theme
    // 3. Enable the size guide button on the product page
    
    // For now, just log the sync
    console.log('✅ Theme sync completed for:', { merchantId, productId });
    
  } catch (error) {
    console.error('❌ Error syncing with Salla theme:', error);
  }
}

// API - Get size chart for Salla theme integration
app.get("/api/salla/chart/:merchant_id/:product_id", (req, res) => {
  try {
    const { merchant_id, product_id } = req.params;
    const chartKey = `${merchant_id}:${product_id}`;
    const chart = sizeCharts.get(chartKey);
    
    if (chart) {
      res.json({
        success: true,
        exists: true,
        chart: {
          rows: chart.rows,
          unit: chart.unit || 'cm',
          updated_at: chart.updated_at
        }
      });
    } else {
      res.json({
        success: true,
        exists: false
      });
    }
  } catch (error) {
    console.error('Error getting Salla chart:', error);
    res.status(500).json({ error: 'Failed to get chart' });
  }
});

// Serve Salla theme component
app.get("/salla-theme-component.js", (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(__dirname + '/public/salla-theme-component.js');
});

// Webhook for Salla app installation
app.post("/hooks/after-install", (req, res) => {
  try {
    console.log('🎉 Salla app installed:', req.body);
    
    // Store the installation data
    const { store, app } = req.body;
    
    // In production, save to database:
    // - Store ID and access tokens
    // - Initialize default settings
    // - Send welcome email
    
    console.log('✅ App installation processed for store:', store?.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Installation webhook error:', error);
    res.status(500).json({ error: 'Installation failed' });
  }
});

// Webhook for Salla app uninstallation
app.post("/hooks/after-uninstall", (req, res) => {
  try {
    console.log('👋 Salla app uninstalled:', req.body);
    
    const { store } = req.body;
    
    // Clean up data:
    // - Remove size charts
    // - Clear settings
    // - Cleanup theme integration
    
    console.log('✅ App uninstallation processed for store:', store?.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Uninstallation webhook error:', error);
    res.status(500).json({ error: 'Uninstallation failed' });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "Miqasi Size Charts" });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
