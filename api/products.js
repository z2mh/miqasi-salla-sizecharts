// Salla Products API endpoint
export default async function handler(req, res) {
  try {
    const { access_token } = req.query;
    
    if (!access_token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Fetch products from Salla API
    const response = await fetch('https://api.salla.dev/admin/v2/products', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Salla API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format products for frontend
    const products = data.data.map(product => ({
      id: product.id,
      name: product.name,
      image: product.main_image?.url,
      price: product.price,
      sku: product.sku,
      status: product.status
    }));
    
    res.status(200).json({
      success: true,
      products: products,
      pagination: {
        current_page: data.pagination?.current_page || 1,
        total: data.pagination?.total || 0,
        per_page: data.pagination?.per_page || 15
      }
    });
    
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products', 
      message: error.message 
    });
  }
}