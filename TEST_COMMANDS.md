# 🧪 Testing Your Size Chart API

## Method 1: Using curl commands

### Save a Size Chart:
```bash
curl -X POST http://localhost:8082/api/chart-data \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "test_store",
    "product_id": "12345",
    "chart_data": {
      "Small": {"chest": "36", "waist": "30"},
      "Medium": {"chest": "38", "waist": "32"}, 
      "Large": {"chest": "40", "waist": "34"}
    },
    "unit": "inches"
  }'
```

### Get a Size Chart:
```bash
curl "http://localhost:8082/api/chart-data?store_id=test_store&product_id=12345"
```

## Method 2: Using our test script

```bash
# Run with KV enabled
KV_REST_API_URL="https://poetic-mudfish-14474.upstash.io" \
KV_REST_API_TOKEN="ATiKAAIncDEwZGQ2OWExMzg3MGQ0ODRkYjdmMTgyOTlkMjk0MWY1N3AxMTQ0NzQ" \
node test-persistence.js
```

## Method 3: View Data in Upstash Console

1. Go to: https://console.upstash.com/
2. Click your database: `upstash-kv-sky-dog`
3. Go to "REPL" tab
4. Run these Redis commands:

```redis
# See all size chart keys
KEYS sizechart:*

# Get specific chart data  
GET "sizechart:demo_store:999888777"

# Get all keys for a store
SMEMBERS "sizechart:store:demo_store"
```

## Method 4: Browser Testing

1. Open: http://localhost:8082/dashboard
2. Create size charts in the UI
3. Close browser/restart server
4. Check if charts persist ✅

## Expected Results:

✅ **Working correctly if you see:**
- `✅ Vercel KV storage ready (Tier 1)` in logs
- `📊 Saved size chart to Vercel KV` in logs  
- `📖 Retrieved size chart from Vercel KV` in logs
- Charts survive server restarts

❌ **Problem if you see:**
- `💭 Using memory storage` in logs
- Charts disappear after restart
- `❌ No chart found` after saving

Your data is now persistent in Redis! 🎉