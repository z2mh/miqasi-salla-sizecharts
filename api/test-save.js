// Test saving directly to KV
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing direct KV save...');
    
    const testKey = `sizechart:test_store:${Date.now()}`;
    const testData = {
      store_id: 'test_store',
      product_id: Date.now().toString(),
      sizes: { 'S': { chest: '36' }, 'M': { chest: '38' } },
      unit: 'cm',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to KV
    await kv.set(testKey, JSON.stringify(testData));
    console.log('✅ Saved to KV:', testKey);
    
    // Retrieve from KV
    const retrieved = await kv.get(testKey);
    console.log('✅ Retrieved from KV:', retrieved ? 'Success' : 'Failed');
    
    res.json({
      success: true,
      message: 'Direct KV save test completed',
      saved_key: testKey,
      retrieved: retrieved ? 'Success' : 'Failed',
      data: retrieved
    });
    
  } catch (error) {
    console.error('❌ KV Save Test Error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
}