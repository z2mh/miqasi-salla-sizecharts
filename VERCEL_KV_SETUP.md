# Vercel KV Setup Guide for Miqasi Size Charts

## 🎯 Overview

Your app now uses a **4-tier storage system** for maximum reliability:

1. **Tier 1: Vercel KV (Redis)** - Production storage (persistent, fast)
2. **Tier 2: Database (Sequelize)** - Fallback database storage
3. **Tier 3: File Storage** - Local development storage
4. **Tier 4: Memory Storage** - Emergency fallback

## 🚀 Setting Up Vercel KV

### Step 1: Create a KV Store in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **KV (Redis)**
4. Choose a name for your KV store (e.g., "miqasi-sizecharts-kv")
5. Select your preferred region
6. Click **Create**

### Step 2: Get Your KV Credentials

1. After creating the KV store, go to the **Settings** tab
2. Copy the **KV_REST_API_URL** and **KV_REST_API_TOKEN**
3. These will look like:
   ```
   KV_REST_API_URL=https://xyz-kv-123.upstash.io
   KV_REST_API_TOKEN=AXXXbCCCdDDDeeeFFFF
   ```

### Step 3: Configure Environment Variables

#### For Vercel Deployment:
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   ```
   KV_REST_API_URL=your_actual_kv_url
   KV_REST_API_TOKEN=your_actual_kv_token
   ```

#### For Local Development (Optional):
1. Update your `.env` file:
   ```bash
   # Add these to your .env file
   KV_REST_API_URL=your_actual_kv_url
   KV_REST_API_TOKEN=your_actual_kv_token
   ```

### Step 4: Deploy to Vercel

1. Push your code to GitHub
2. Deploy via Vercel (automatic if connected)
3. Your app will now use Vercel KV for persistent storage!

## 🧪 Testing

### Test Locally (without KV):
```bash
npm start
# Should fallback to file storage gracefully
```

### Test on Vercel (with KV):
1. Deploy to Vercel
2. Save a size chart
3. Restart the app (redeploy)
4. Check if the size chart persists ✅

## 📊 How It Works

### Storage Priority:
```
Vercel KV → Database → File → Memory
```

### Logs to Watch:
- `✅ Vercel KV storage ready (Tier 1)` - KV working
- `📊 Saved size chart to Vercel KV` - Data persisted to KV
- `📖 Retrieved size chart from Vercel KV` - Data loaded from KV

### Fallback Behavior:
- If KV fails → tries database
- If database fails → tries file storage
- If file fails → uses memory (temporary)

## 🔧 Troubleshooting

### KV Not Working?
1. Check environment variables are set correctly
2. Verify KV store is active in Vercel dashboard
3. Check logs for connection errors

### Data Not Persisting?
1. Confirm you're using the production URL (not local)
2. Check if KV storage logs show successful saves
3. Verify environment variables are deployed

## 🎉 Benefits

✅ **True Persistence** - Data survives app restarts, deployments  
✅ **Fast Performance** - Redis-based KV storage  
✅ **Global Distribution** - Vercel's edge network  
✅ **Automatic Fallbacks** - Never loses functionality  
✅ **Zero Configuration** - Works immediately after setup  

## 💰 Cost

- **Vercel KV**: Free tier includes 30,000 commands/month
- **Perfect for size charts**: Typically uses ~10 commands per chart save/load
- **Scales automatically**: Pay as you grow

Your size chart data will now persist permanently! 🎉