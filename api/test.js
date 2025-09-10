// Simple test endpoint to verify API routing
export default function handler(req, res) {
  console.log('🧪 TEST API Called:', {
    method: req.method,
    query: req.query,
    url: req.url
  });
  
  res.status(200).json({
    success: true,
    message: 'API routing is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });
}