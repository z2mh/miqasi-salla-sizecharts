// OAuth callback endpoint for Salla authentication
export default async function handler(req, res) {
  try {
    console.log('🔐 OAuth callback called:', {
      method: req.method,
      query: req.query,
      headers: {
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      }
    });

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, state, error, error_description } = req.query;

    // Handle OAuth error
    if (error) {
      console.error('❌ OAuth error:', { error, error_description });
      return res.redirect(`/dashboard?error=${encodeURIComponent(error_description || error)}`);
    }

    // Handle missing code
    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect('/dashboard?error=No authorization code received');
    }

    console.log('✅ Authorization code received, exchanging for token...');

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
        redirect_uri: process.env.SALLA_OAUTH_CLIENT_REDIRECT_URI
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText
      });
      return res.redirect(`/dashboard?error=Authentication failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Extract store/merchant ID
    const storeId = tokenData.merchant?.id || tokenData.user?.id || tokenData.store_id || 'demo_store';
    
    // Store token securely (in production, use database)
    // For now, pass via URL parameters
    const dashboardUrl = `/dashboard?access_token=${tokenData.access_token}&store_id=${storeId}`;
    
    console.log('✅ Redirecting to dashboard with store ID:', storeId);
    return res.redirect(dashboardUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return res.redirect(`/dashboard?error=Authentication failed: ${error.message}`);
  }
}