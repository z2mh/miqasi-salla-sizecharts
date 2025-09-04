// Salla Webhook handler for app install/uninstall
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const event = req.body;
    console.log('Webhook received:', JSON.stringify(event, null, 2));

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.SALLA_WEBHOOK_SECRET || '8e1fb7a0ea9500dbdf8228d017ba5fbb';
    
    // Handle different webhook events
    switch (event.event) {
      case 'app.store.authorize':
        await handleAppInstall(event);
        break;
        
      case 'app.store.revoke': 
        await handleAppUninstall(event);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
}

// Handle app installation
async function handleAppInstall(event) {
  try {
    const { merchant, access_token } = event.data;
    
    if (!access_token || !merchant) {
      throw new Error('Missing access token or merchant data');
    }

    console.log(`App installed for merchant: ${merchant.id} - ${merchant.name}`);
    
    // Create app snippet to inject widget
    const snippet = {
      name: 'Miqasi Size Charts Widget',
      place: 'product.single.details.after', // Inject after product details
      code: `<script>
(function() {
  // Load Miqasi widget for store {{store.id}}
  const script = document.createElement('script');
  script.src = 'https://app.trynashr.com/widget.js';
  script.async = true;
  script.dataset.storeId = '{{store.id}}';
  script.dataset.userId = '{{user.id}}';
  document.head.appendChild(script);
})();
</script>`
    };

    // Add snippet via Salla API
    const response = await fetch('https://api.salla.dev/admin/v2/apps/snippets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(snippet)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Snippet created successfully:', result);
    } else {
      const error = await response.text();
      console.error('Failed to create snippet:', response.status, error);
    }

  } catch (error) {
    console.error('App install handler error:', error);
  }
}

// Handle app uninstallation
async function handleAppUninstall(event) {
  try {
    const { merchant, access_token } = event.data;
    
    console.log(`App uninstalled for merchant: ${merchant?.id} - ${merchant?.name}`);
    
    if (!access_token) {
      console.log('No access token available for cleanup');
      return;
    }

    // Remove all Miqasi snippets
    try {
      const snippetsResponse = await fetch('https://api.salla.dev/admin/v2/apps/snippets', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      });

      if (snippetsResponse.ok) {
        const snippets = await snippetsResponse.json();
        const miqasiSnippets = snippets.data.filter(s => 
          s.name === 'Miqasi Size Charts Widget' || 
          s.code.includes('app.trynashr.com/widget.js')
        );

        // Delete each Miqasi snippet
        for (const snippet of miqasiSnippets) {
          await fetch(`https://api.salla.dev/admin/v2/apps/snippets/${snippet.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Accept': 'application/json'
            }
          });
          console.log(`Deleted snippet: ${snippet.id}`);
        }
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

  } catch (error) {
    console.error('App uninstall handler error:', error);
  }
}