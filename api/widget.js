import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Read the widget file from public directory
    const widgetPath = path.join(process.cwd(), 'public', 'store-widget.js');
    const widgetContent = fs.readFileSync(widgetPath, 'utf8');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(200).send(widgetContent);
  } catch (error) {
    console.error('Error serving widget:', error);
    res.status(404).json({ error: 'Widget not found' });
  }
}