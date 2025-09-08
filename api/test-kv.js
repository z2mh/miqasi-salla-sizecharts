// Test endpoint to check KV connection
export default async function handler(req, res) {
  console.log('🧪 Testing KV Connection...');
  console.log('Environment variables:');
  console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? '✅ Set' : '❌ Missing');
  console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? '✅ Set' : '❌ Missing');

  try {
    // Try to import and test KV
    const { kv } = await import('@vercel/kv');
    
    // Test KV connection
    await kv.set('test-connection', 'working');
    const result = await kv.get('test-connection');
    
    console.log('✅ KV Test Result:', result);
    
    res.json({
      success: true,
      kv_connection: result === 'working' ? 'Working' : 'Failed',
      environment_vars: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'Set' : 'Missing',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'Set' : 'Missing'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ KV Test Error:', error);
    res.json({
      success: false,
      error: error.message,
      environment_vars: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'Set' : 'Missing',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'Set' : 'Missing'
      }
    });
  }
}