// Salla OAuth Authentication endpoint
export default async function handler(req, res) {
  try {
    // Handle OAuth redirect from Salla
    if (req.method === 'GET') {
      const { code, state } = req.query;
      
      if (!code) {
        // Redirect to Salla OAuth
        const salla_client_id = process.env.SALLA_CLIENT_ID || 'your_salla_client_id';
        const redirect_uri = 'https://app.trynashr.com/api/auth';
        const scope = 'read:products,read:stores';
        
        const authUrl = `https://accounts.salla.sa/oauth2/auth?response_type=code&client_id=${salla_client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=random_state`;
        
        return res.redirect(authUrl);
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://accounts.salla.sa/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.SALLA_CLIENT_ID,
          client_secret: process.env.SALLA_CLIENT_SECRET,
          code: code,
          redirect_uri: 'https://app.trynashr.com/api/auth'
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }
      
      const tokenData = await tokenResponse.json();
      
      // Store token and redirect to dashboard
      // In production, store in secure database
      const dashboardUrl = `/dashboard?access_token=${tokenData.access_token}&store_id=${tokenData.merchant.id}`;
      
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