import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import './Home.css';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutLoading, setShowLogoutLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        .then((userData) => {
        setIsLoggedIn(true); // Backend confirmed login
        })
        .catch(() => {
        // Token is invalid, clean up
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setIsLoggedIn(false);
        });
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

            {/* Search icon before wishlist*/}
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

            <a href="/cart">Cart (0)</a>
          </div>
        </div>

        {showSearch && (
          <div className="container search-bar">
            <input type="text" placeholder="Search for Products or Businesses..." autoFocus />
          </div>
        )}
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Discover Groceries from Multiple Businesses</h1>
          <p>Shop fresh, organic, and local products from your favorite stores all in one place.</p>
          <a href="/shop" className="btn">Start Shopping</a>
        </div>
      </section>

      <main className="container">
        <h2 className="section-title">Featured Businesses</h2>
        <div className="categories">
          <div className="category-card">
            <div className="category-img" style={{ backgroundColor: '#e0f0ff' }}>[GreenFresh Logo]</div>
            <div className="category-info">
              <h3>GreenFresh Market</h3>
              <a href="/vendor/greenfresh">Visit Store</a>
            </div>
          </div>
          <div className="category-card">
            <div className="category-img" style={{ backgroundColor: '#ffe6cc' }}>[Nature Basket Logo]</div>
            <div className="category-info">
              <h3>Nature Basket</h3>
              <a href="/vendor/naturebasket">Visit Store</a>
            </div>
          </div>
          <div className="category-card">
            <div className="category-img" style={{ backgroundColor: '#fceef5' }}>[Daily Organics Logo]</div>
            <div className="category-info">
              <h3>Daily Organics</h3>
              <a href="/vendor/dailyorganics">Visit Store</a>
            </div>
          </div>
        </div>

        <h2 className="section-title">Featured Products</h2>
        <div className="products-grid">
          <div className="product-card">
            <div className="product-image">[Organic Avocados]</div>
            <h3 className="product-title">Organic Avocados</h3>
            <div className="product-price">$4.99</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
          <div className="product-card">
            <div className="product-image">[Whole Grain Bread]</div>
            <h3 className="product-title">Whole Grain Bread</h3>
            <div className="product-price">$3.50</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
          <div className="product-card">
            <div className="product-image">[Almond Milk]</div>
            <h3 className="product-title">Almond Milk</h3>
            <div className="product-price">$2.99</div>
            <button className="add-to-cart">Add to Cart</button>
          </div>
        </div>
        
        {/* Latest News / Blog */}
        <h2 className="section-title">Latest News</h2>
        <div className="blog-section">
          <div className="blog-card">
            <h3>Tips for Choosing Organic</h3>
            <p>Learn how to pick the best organic items and why they matter.</p>
            <a href="/blog/organic-tips">Read More</a>
        </div>
        <div className="blog-card">
            <h3>Meet Our Vendors</h3>
            <p>Explore stories from our trusted vendors and local farms.</p>
            <a href="/blog/vendors">Read More</a>
        </div>
        </div>

        {/* Best Sellers */}
        <h2 className="section-title">Best Sellers</h2>
        <div className="products-grid">
        <div className="product-card">
            <div className="product-image">[Fresh Bananas]</div>
            <h3 className="product-title">Fresh Bananas</h3>
            <div className="product-price">$1.99</div>
            <button className="add-to-cart">Add to Cart</button>
        </div>
        <div className="product-card">
            <div className="product-image">[Free-range Eggs]</div>
            <h3 className="product-title">Free-range Eggs</h3>
            <div className="product-price">$2.49</div>
            <button className="add-to-cart">Add to Cart</button>
        </div>
        <div className="product-card">
            <div className="product-image">[Organic Honey]</div>
            <h3 className="product-title">Organic Honey</h3>
            <div className="product-price">$6.00</div>
            <button className="add-to-cart">Add to Cart</button>
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
      {/* Back to Top Button */}
      {typeof window !== 'undefined' && (
        <button
            className={`back-to-top ${window.scrollY > 200 ? 'show' : ''}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
            ↑
        </button>
        )}

    </>
  );
}
