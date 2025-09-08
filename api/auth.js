// Salla OAuth Authentication endpoint
export default async function handler(req, res) {
  try {
    // Handle OAuth redirect from Salla
    if (req.method === 'GET') {
      const { code, state } = req.query;
      
      if (!code) {
        // Check if this is already a redirect attempt to prevent loops
        const referer = req.headers.referer || '';
        if (referer.includes('accounts.salla.sa')) {
          return res.status(400).json({ 
            error: 'OAuth Error', 
            message: 'Authorization was not granted or was cancelled by the user.' 
          });
        }
        
        // Redirect to Salla OAuth
        const salla_client_id = process.env.SALLA_OAUTH_CLIENT_ID;
        const redirect_uri = process.env.SALLA_OAUTH_CLIENT_REDIRECT_URI || 'https://app.trynashr.com/api/auth';
        const scope = 'offline_access+products.read+settings.read';
        const state = Math.random().toString(36).substring(2, 15);
        
        if (!salla_client_id) {
          return res.status(500).json({ error: 'OAuth client ID not configured' });
        }
        
        const authUrl = `https://accounts.salla.sa/oauth2/auth?response_type=code&client_id=${salla_client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
        
        return res.redirect(authUrl);
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://accounts.salla.sa/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.SALLA_OAUTH_CLIENT_ID,
          client_secret: process.env.SALLA_OAUTH_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.SALLA_OAUTH_CLIENT_REDIRECT_URI || 'https://app.trynashr.com/api/auth'
        }).toString()
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          body: errorText
        });
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      console.log('Token data received:', JSON.stringify(tokenData, null, 2));
      
      // Store token and redirect to dashboard
      // In production, store in secure database
      const storeId = tokenData.merchant?.id || tokenData.user?.id || tokenData.store_id || 'demo_store';
      const dashboardUrl = `/dashboard?access_token=${tokenData.access_token}&store_id=${storeId}`;
      
      return res.redirect(dashboardUrl);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      message: error.message 
    });
  }
}