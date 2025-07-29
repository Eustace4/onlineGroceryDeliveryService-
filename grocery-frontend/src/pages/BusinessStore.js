import React, { useState, useEffect } from 'react';
import './BusinessStore.css';
import { useLocation, useNavigate } from 'react-router-dom';


const BusinessStore = () => {
  const [categoryMap, setCategoryMap] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { business } = location.state || {};
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  

  
  useEffect(() => {
    // Fetch categories from database with IDs
      fetch('http://127.0.0.1:8000/api/categories')
          .then(res => res.json())
          .then(data => {
              // Store categories with both ID and name
              const categoryMap = {};
              data.forEach(cat => {
                  categoryMap[cat.id] = cat.name;
              });
              
              // Store the mapping for filtering
              setCategoryMap(categoryMap);
              
              const dbCategoryNames = data.map(cat => cat.name);
              setCategories(['All', ...dbCategoryNames]);
          })
          .catch(error => {
              console.error('Error fetching categories:', error);
          });
  }, []);

  
  
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
  }, []);

  // Fetch products for the business
  useEffect(() => {
    if (business?.id) {
      setIsLoading(true);
      fetch(`http://127.0.0.1:8000/api/businesses/${business.id}/products`)
        .then(res => res.json())
        .then(data => {
          const allProducts = data.products || [];
          setProducts(allProducts);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching products:', error);
          setIsLoading(false);
        });
    }
  }, [business]);

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCartOpen && !event.target.closest('.cart-sidebar') && !event.target.closest('.toggle-cart-btn')) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCartOpen]);
  

  const handleAddToCart = (product, quantity) => {
    if (!product || quantity < 1) return;

    if (cart.length > 0 && cart[0].businessId !== business.id) {
      alert('You can only add products from one business at a time. Please clear your cart first.');
      return;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === product.id);
      let updatedCart = [...prevCart];

      if (existingIndex >= 0) {
        updatedCart[existingIndex].quantity += quantity;
      } else {
        updatedCart.push({ ...product, quantity, businessId: business.id });
      }

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });

    // Show success message with better UX
    showNotification('Product added to cart! 🛒');
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
        }
        return item;
      });
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== productId);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
    showNotification('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    showNotification('Cart cleared');
  };


  const showNotification = (message) => {
    // Simple notification system (you could enhance this with a proper toast library)
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
      }, 300);
    }, 2000);
  };

  // Filter products based on category and search term
  // Filter products based on category and search term
  const filteredProducts = products.filter(product => {
    // Get category name from category_id
    const productCategoryName = categoryMap[product.category_id];
    const matchesCategory = selectedCategory === 'All' || productCategoryName === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Get unique categories for filter dropdown
  //const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!business) {
    return (
      <div className="business-store">
        <div className="store-container">
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <h2>No business selected</h2>
            <p>Please select a business to view their products.</p>
            <button 
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Go back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-store">
      {/* Toggle Cart Button */}
      <button className="toggle-cart-btn" onClick={() => setIsCartOpen(!isCartOpen)}>
        {isCartOpen ? 'Close Cart' : `Cart (${cartItemCount})`}
      </button>

      <div className="store-container" style={{ marginRight: isCartOpen ? '400px' : '0' }}>
        {/* Back Link */}
        <a className="back-link" onClick={() => navigate(-1)}>
          ← Back to Businesses
        </a>

        {/* Business Info Section */}
        <div className="business-info">
          <img
            src={`http://127.0.0.1:8000/storage/${business.logo}`}
            alt={`${business.name} Logo`}
            className="business-logo"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/100x100?text=Logo';
            }}
          />
          <h2 className="business-name">{business.name}</h2>
          {business.description && (
            <p style={{ fontSize: '16px', opacity: '0.9', maxWidth: '600px', margin: '10px auto 0' }}>
              {business.description}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <label>Filter by Category:</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Products Section */}
        <h3 className="product-heading">
          {selectedCategory === 'All' ? 'All Products' : `${selectedCategory} Products`}
          {filteredProducts.length > 0 && (
            <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
              ({filteredProducts.length} items)
            </span>
          )}
        </h3>

        {/* Loading State */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <p>Loading products...</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#666' }}>
                <h3>No products found</h3>
                <p>
                  {searchTerm ? 
                    `No products match "${searchTerm}" in ${selectedCategory === 'All' ? 'any category' : selectedCategory}` :
                    `No products available in ${selectedCategory === 'All' ? 'this store' : selectedCategory}`
                  }
                </p>
                {(searchTerm || selectedCategory !== 'All') && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                    }}
                    style={{
                      marginTop: '20px',
                      padding: '10px 20px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Show All Products
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <img
                    src={`http://127.0.0.1:8000/storage/${product.image}`}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/280x200?text=Product+Image';
                    }}
                  />
                  <h4>{product.name}</h4>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  <p className="product-price">₺{parseFloat(product.price).toLocaleString()}</p>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(product, 1)}
                  >
                    Add to Cart
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>🛒 Your Cart</h3>
          <button 
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#666' }}>
            <p>Your cart is empty</p>
            <p style={{ fontSize: '14px' }}>Add some products to get started!</p>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <span>{item.name}</span>
                  <div style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                    ₺{parseFloat(item.price).toLocaleString()} each
                  </div>
                  <div className="qty-controls">
                    <div>
                      <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </div>
                  <div style={{ fontWeight: '600', color: '#4CAF50', textAlign: 'right' }}>
                    ₺{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Items ({cartItemCount}):</span>
                <span>₺{cartTotal.toLocaleString()}</span>
              </div>
              <h4 style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' }}>
                Total: ₺{cartTotal.toLocaleString()}
              </h4>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                  onClick={clearCart}
                  style={{
                    flex: '0 0 auto',
                    padding: '10px 15px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
                <button className="checkout-btn" onClick={() => navigate('/checkout', { 
                  state: { 
                    cart, 
                    business, 
                    cartTotal 
                  }
                })}>
                  Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessStore;