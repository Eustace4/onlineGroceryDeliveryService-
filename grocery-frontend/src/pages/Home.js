import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import './Home.css';


export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutLoading, setShowLogoutLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState([]);


  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalItems);
  };



  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    fetch('http://localhost:8000/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(() => {
        setIsLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    updateCartCount();
  }, []);


  const handleLogout = () => {
    setShowLogoutLoading(true);
    setTimeout(() => {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      setIsLoggedIn(false);
      setShowLogoutLoading(false);
      navigate('/');
    }, 1500);
  };

  useEffect(() => {
    const handleScroll = () => {
      const button = document.querySelector('.back-to-top');
      if (window.scrollY > 200) {
        button?.classList.add('show');
      } else {
        button?.classList.remove('show');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    fetch('http://localhost:8000/api/public/businesses', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched businesses:', data);
        console.log('🚀 businesses API returned:', data);

        // ✅ inspect if it's data or data.data
        if (Array.isArray(data)) {
          setBusinesses(data);
        } else if (Array.isArray(data.data)) {
          setBusinesses(data.data);
        } else {
          setBusinesses([]); // fallback
        }
      })
      .catch((err) => {
        console.error('Failed to fetch businesses', err);
        setBusinesses([]);
      });
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/products')
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched products:', data);
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      });
  }, []);

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalItems);
  }, [cart]);




  return (
    <>
      {showLogoutLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <header>
        <div className="container header-container">
          <div className="logo">
            <img src={require('../images/logo.png')} alt="Organic Shop Logo" />
          </div>

          <div className="user-actions">
            <span className="search-icon" onClick={() => setShowSearch(!showSearch)}>
              <FaSearch />
            </span>
            <a href="/wishlist">Wishlist</a>
            {isLoggedIn ? (
              <>
                <Link to="/my-account">My Account</Link>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</a>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
            <a href="/cart">Cart ({cartCount})</a>
          </div>
        </div>

        {showSearch && (
          <div className="container search-bar">
            <input type="text" placeholder="Search for Products or Businesses..." autoFocus />
          </div>
        )}
      </header>
      {cart.length > 0 && (
        <div className="cart-panel container">
          <h3>Your Cart</h3>
          <ul>
            {cart.map((item) => (
              <li key={item.id} style={{ marginBottom: '10px' }}>
                <strong>{item.name}</strong> — ${item.price} × {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Groceries from Multiple Businesses</h1>
          <p>Shop fresh, organic, and local products from your favorite stores all in one place.</p>
          <a href="/shop" className="btn">Start Shopping</a>
        </div>
      </section>

      <main className="container">
        {/* Featured Businesses */}
        <h2 className="section-title">Featured Businesses</h2>
        <div className="categories">
          {businesses.map((business) => (
            <div className="category-card" key={business.id}>
              <div className="category-img">
                <img
                  src={`http://localhost:8000/storage/${business.logo}`}
                  alt={business.name}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
              </div>
              <div className="category-info">
                <h3>{business.name}</h3>
                <a href={`/vendor/${business.id}`}>Visit Store</a>
              </div>
            </div>
          ))}
        </div>


        {/* Featured Products */}
        <h2 className="section-title">Featured Products</h2>
        <div className="products-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              <div className="product-image">
                <img
                  src={`http://localhost:8000/storage/${product.image}`}
                  alt={product.name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px' }}
                />
              </div>
              <h3 className="product-title">{product.name}</h3>
              <div className="product-price">${product.price}</div>
              <button className="add-to-cart" onClick={() => handleAddToCart(product)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>


        {/* Best Sellers */}
        
        <h2 className="section-title">Best Sellers</h2>
        <div className="products-grid">
          <div className="product-card">
            <div className="product-image">
              <img src={require('../images/products/fresh-bananas.jpeg')} alt="Fresh Bananas" style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px'}} />
            </div>
            <h3 className="product-title">Fresh Bananas</h3>
            <div className="product-price">$1.99</div>
            <button
              className="add-to-cart"
              onClick={() =>
                handleAddToCart({
                  id: 'banana123',
                  name: 'Fresh Bananas',
                  price: 1.99,
                  image: 'images/products/fresh-bananas.jpeg',
                })
              }
            >
              Add to Cart
            </button>

          </div>
          <div className="product-card">
            <div className="product-image">
              <img src={require('../images/products/free-range-eggs.jpg')} alt="Free-range Eggs" style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px'}} />
            </div>
            <h3 className="product-title">Free-range Eggs</h3>
            <div className="product-price">$2.49</div>
            <button
              className="add-to-cart"
              onClick={() =>
                handleAddToCart({
                  id: 'eggs123',
                  name: 'Organic Eggs',
                  price: 3.49,
                  image: 'images/products/organic-eggs.jpeg',
                })
              }
            >
              Add to Cart
            </button>

          </div>
          <div className="product-card">
            <div className="product-image">
              <img src={require('../images/products/organic-honey.jpeg')} alt="Organic Honey" style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px'}} />
            </div>
            <h3 className="product-title">Organic Honey</h3>
            <div className="product-price">$6.00</div>
            <button
              className="add-to-cart"
              onClick={() =>
                handleAddToCart({
                  id: 'honey123',
                  name: 'Pure Honey',
                  price: 5.99,
                  image: 'images/products/pure-honey.jpeg',
                })
              }
            >
              Add to Cart
            </button>

          </div>
        </div>


        {/* Why Shop With Us */}
        <h2 className="section-title">Why Shop With Us?</h2>
        <div className="why-shop">
          <div className="shop-benefit">
            <h4>✅ Trusted Vendors</h4>
            <p>We partner only with reliable and certified vendors.</p>
          </div>
          <div className="shop-benefit">
            <h4>🚚 Fast Delivery</h4>
            <p>Quick and reliable delivery service to your doorstep.</p>
          </div>
          <div className="shop-benefit">
            <h4>🌱 Organic & Fresh</h4>
            <p>Enjoy hand-picked, chemical-free organic groceries.</p>
          </div>
        </div>
      </main>

      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/feedback">Feedback</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Contact</h3>
              <ul>
                <li>123 Market Lane</li>
                <li>Grocer City, GR 45678</li>
                <li>Phone: (555) 123-4567</li>
                <li>Email: hello@groceryhub.com</li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>© 2025 GroceryHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </>
  );
}
