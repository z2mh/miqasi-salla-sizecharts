// Manual snippet management API
export default async function handler(req, res) {
  try {
    const { access_token, action = 'create' } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    if (req.method === 'POST' && action === 'create') {
      // Create Miqasi widget snippet
      await createSnippet(access_token, res);
    } else if (req.method === 'DELETE' && action === 'remove') {
      // Remove Miqasi snippets
      await removeSnippets(access_token, res);
    } else if (req.method === 'GET' && action === 'list') {
      // List all snippets
      await listSnippets(access_token, res);
    } else {
      res.status(400).json({ 
        error: 'Invalid request',
        help: 'Use POST with action=create, DELETE with action=remove, or GET with action=list'
      });
    }

  } catch (error) {
    console.error('Snippets API error:', error);
    res.status(500).json({ error: 'Failed to manage snippets', message: error.message });
  }
}

// Create the Miqasi widget snippet
async function createSnippet(accessToken, res) {
  const snippet = {
    name: 'Miqasi Size Charts Widget',
    place: 'product.single.details.after',
    code: `<!-- Miqasi Size Charts Widget -->
<script>
(function() {
  'use strict';
  
  // Only load on product pages
  if (!window.location.pathname.includes('/product/')) return;
  
  // Load Miqasi widget
  const script = document.createElement('script');
  script.src = 'https://app.trynashr.com/widget.js';
  script.async = true;
  script.id = 'miqasi-widget';
  
  // Add store context
  script.dataset.storeId = '{{store.id}}';
  script.dataset.storeDomain = '{{store.domain}}';
  
  // Prevent duplicate loading
  if (!document.getElementById('miqasi-widget')) {
    document.head.appendChild(script);
  }
})();
</script>

<!-- Miqasi CSS Styles -->
<style>
#miqasi-size-guide-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border: none !important;
  padding: 12px 24px !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  margin: 15px 0 !important;
  transition: transform 0.2s !important;
  width: 100% !important;
  max-width: 300px !important;
}

#miqasi-size-guide-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(102,126,234,0.3) !important;
}

#miqasi-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: rgba(0, 0, 0, 0.8) !important;
  z-index: 10000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px !important;
}
</style>`
  };

  const response = await fetch('https://api.salla.dev/admin/v2/apps/snippets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(snippet)
  });

  if (response.ok) {
    const result = await response.json();
    res.status(200).json({
      success: true,
      message: 'Miqasi widget snippet created successfully!',
      snippet: result
    });
  } else {
    const error = await response.text();
    res.status(response.status).json({
      success: false,
      error: 'Failed to create snippet',
      details: error
    });
  }
}

// Remove all Miqasi snippets
async function removeSnippets(accessToken, res) {
  const snippetsResponse = await fetch('https://api.salla.dev/admin/v2/apps/snippets', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!snippetsResponse.ok) {
    return res.status(snippetsResponse.status).json({
      success: false,
      error: 'Failed to fetch snippets'
    });
  }

  const snippets = await snippetsResponse.json();
  const miqasiSnippets = snippets.data.filter(s => 
    s.name === 'Miqasi Size Charts Widget' || 
    s.code.includes('app.trynashr.com/widget.js') ||
    s.code.includes('miqasi')
  );

  const deletedSnippets = [];
  
  for (const snippet of miqasiSnippets) {
    try {
      const deleteResponse = await fetch(`https://api.salla.dev/admin/v2/apps/snippets/${snippet.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (deleteResponse.ok) {
        deletedSnippets.push(snippet.id);
      }
    } catch (deleteError) {
      console.error(`Failed to delete snippet ${snippet.id}:`, deleteError);
    }
  }

  res.status(200).json({
    success: true,
    message: `Removed ${deletedSnippets.length} Miqasi snippets`,
    deleted: deletedSnippets
  });
}

// List all snippets
async function listSnippets(accessToken, res) {
  const response = await fetch('https://api.salla.dev/admin/v2/apps/snippets', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (response.ok) {
    const result = await response.json();
    res.status(200).json(result);
  } else {
    const error = await response.text();
    res.status(response.status).json({
      success: false,
      error: 'Failed to list snippets',
      details: error
    });
  }
}