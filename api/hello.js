// Simple test endpoint
export default function handler(req, res) {
  res.status(200).json({
    message: "🚀 Miqasi is working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}