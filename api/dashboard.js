// Dashboard endpoint
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Simple HTML response for dashboard
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Miqasi Dashboard</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            text-align: center; 
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 15px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📏 Miqasi Dashboard</h1>
        <div class="status">✅ App is running successfully on Vercel!</div>
        <p>Size charts management system for Salla stores</p>
        <p><strong>Status:</strong> Active</p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        
        <div style="margin-top: 30px;">
            <h3>Available Endpoints:</h3>
            <ul style="text-align: left; display: inline-block;">
                <li><a href="/api/hello" style="color: white;">/api/hello</a> - Test endpoint</li>
                <li><a href="/api/dashboard" style="color: white;">/api/dashboard</a> - This page</li>
                <li><a href="/widget.js" style="color: white;">/widget.js</a> - Widget script</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard error', details: error.message });
  }
}