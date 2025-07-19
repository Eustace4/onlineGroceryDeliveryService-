import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  MessageSquare,
  Settings,
  Plus,
  LogOut
} from 'lucide-react';
import './MyAccount.css';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

const VendorDashboard = ({ token: propToken }) => {
  const navigate = useNavigate();
  const token = propToken || localStorage.getItem('auth_token');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [vendor, setVendor] = useState({ name: '', email: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    setLoadingProfile(true);
    fetch(`${API_BASE}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : Promise.reject('Profile fetch failed'))
      .then(data => setVendor({ name: data.user.name, email: data.user.email }))
      .catch(() => setError('Failed to fetch profile info.'))
      .finally(() => setLoadingProfile(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoadingBusinesses(true);
    fetch(`${API_BASE}/businesses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : Promise.reject('Business fetch failed'))
      .then(data => {
        setBusinesses(data);
        if (data.length > 0) setSelectedBusiness(data[0]);
      })
      .catch(() => setError('Failed to fetch businesses.'))
      .finally(() => setLoadingBusinesses(false));
  }, [token]);

  useEffect(() => {
    if (!selectedBusiness || !token) return;
    setLoadingProducts(true);
    fetch(`${API_BASE}/businesses/${selectedBusiness.id}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : Promise.reject('Products fetch failed'))
      .then(data => setProducts(data))
      .catch(() => setError('Failed to fetch products.'))
      .finally(() => setLoadingProducts(false));
  }, [selectedBusiness, token]);

  const totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalProducts = businesses.reduce((sum, b) => sum + (b.products || 0), 0);

  const handleAddProductClick = () => alert('Show Add Product Modal');
  const handleAddBusinessClick = () => alert('Show Add Business Modal');

  const handleDeleteBusiness = async (businessId) => {
    if (!window.confirm('Delete this business?')) return;
    try {
      const res = await fetch(`${API_BASE}/businesses/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      if (selectedBusiness?.id === businessId) setSelectedBusiness(null);
      alert('Business deleted successfully');
    } catch {
      alert('Failed to delete business');
    }
  };
  const [businessStats, setBusinessStats] = useState([]);

    useEffect(() => {
      fetch('/api/vendor/dashboard-summary', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
      console.log('📊 DASHBOARD STATS:', data); // ← Add this
      setBusinessStats(data);
    })
        .catch(err => console.error('Dashboard stats error:', err));
    }, []);


  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('Product deleted successfully');
    } catch {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="myaccount-container">
      <aside className="myaccount-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user-info">
            {loadingProfile ? <p>Loading...</p> : (
              <>
                <h4>{vendor.name || 'Vendor'}</h4>
                <span className="user-email">{vendor.email}</span>
              </>
            )}
          </div>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}><ShoppingCart /> Dashboard</button>
          <button onClick={() => setActiveTab('businesses')} className={`nav-item ${activeTab === 'businesses' ? 'active' : ''}`}><Package /> My Businesses</button>
          <button onClick={() => setActiveTab('products')} className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}><Package /> Products</button>
          <button onClick={() => setActiveTab('orders')} className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}><DollarSign /> Orders</button>
          <button onClick={() => setActiveTab('customers')} className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}><Users /> Customers</button>
          <button onClick={() => setActiveTab('messages')} className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}><MessageSquare /> Messages</button>
          <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}><Settings /> Settings</button>
        </nav>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }}>
          <LogOut /> Logout
        </button>
      </aside>

      <main className="myaccount-content">
        {activeTab === 'dashboard' && (
  <div className="tab-content">
    <h1>Dashboard</h1>
    <p>Welcome back! Here's your summary.</p>
    <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
      {/* existing summary cards */}
      <div style={{background:'white', padding:'1rem', borderRadius:'12px', boxShadow:'0 0 10px rgba(0,0,0,0.1)', flex:1}}>
        <p>Total Revenue</p>
        <p style={{fontWeight:'bold', fontSize:'1.5rem'}}>₦{totalRevenue.toLocaleString()}</p>
      </div>
      <div style={{background:'white', padding:'1rem', borderRadius:'12px', boxShadow:'0 0 10px rgba(0,0,0,0.1)', flex:1}}>
        <p>Total Businesses</p>
        <p style={{fontWeight:'bold', fontSize:'1.5rem'}}>{businesses.length}</p>
      </div>
      <div style={{background:'white', padding:'1rem', borderRadius:'12px', boxShadow:'0 0 10px rgba(0,0,0,0.1)', flex:1}}>
        <p>Total Products</p>
        <p style={{fontWeight:'bold', fontSize:'1.5rem'}}>{totalProducts}</p>
      </div>
    </div>

    {/* ✅ ADD THIS BLOCK BELOW */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
      {businessStats.map((biz) => (
        <div
          key={biz.id}
          style={{
            backgroundColor: '#f8f8f9ff',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '1rem',
            flex: '1 1 250px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h3>{biz.name}</h3>
          <p><strong>Total Orders:</strong> {biz.total_orders}</p>
          <p><strong>Total Revenue:</strong> ₦{biz.total_revenue.toLocaleString()}</p>
        </div>
      ))}
    </div>
  </div>
)}


        {activeTab === 'businesses' && (
          <div className="tab-content">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h2>My Businesses</h2>
              <button className="add-btn" onClick={handleAddBusinessClick}><Plus /> Add Business</button>
            </div>
            {loadingBusinesses ? <p>Loading...</p> : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem'}}>
                {businesses.map(b => (
                  <div
                    key={b.id}
                    className={`business-card ${selectedBusiness?.id === b.id ? 'selected-business' : ''}`}
                    onClick={() => {
                      setSelectedBusiness(b);
                      setActiveTab('products');
                    }}
                    style={{
                      backgroundColor: selectedBusiness?.id === b.id ? '#d1fae5' : 'white',
                      border: '1px solid #ccc',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    <h3 style={{marginTop:0, marginBottom:'0.5rem'}}>{b.name}</h3>
                    <p><strong>Email:</strong> {b.email}</p>
                    <p><strong>Phone:</strong> {b.phone}</p>
                    <p><strong>Address:</strong> {b.address}</p>
                    <div className="business-card-buttons" onClick={e => e.stopPropagation()}>
                      <button
                        className="edit-btn"
                        onClick={() => alert(`Edit business ${b.name}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteBusiness(b.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="tab-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Products for <span style={{ color: '#22c55e' }}>{selectedBusiness?.name}</span></h2>
              <button className="add-btn" onClick={handleAddProductClick}><Plus /> Add Product</button>
            </div>
            {loadingProducts ? <p>Loading...</p> : (
              products.length === 0 ? (
                <div className="empty-state">
                  <p>No products have been added for <strong>{selectedBusiness?.name}</strong>.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {products.map(product => (
                    <div key={product.id} className="product-card">
                      <img
                        src={product.image ? `/storage/${product.image}` : '/placeholder.png'}
                        alt={product.name}
                        className="product-image"
                      />
                      <h4 style={{ margin: '0.5rem 0 0.25rem 0' }}>{product.name}</h4>
                      <p style={{ fontWeight: 'bold' }}>₦{product.price}</p>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {product.category?.name}
                      </p>
                      <p style={{
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            color:
                              product.stock === 0
                                ? '#dc2626'   // Red
                                : product.stock <= 5
                                ? '#ea580c'   // Orange
                                : '#16a34a'   // Green
                          }}
                        >
                          Stock: {product.stock}
                        </p>

                      <div className="business-card-buttons" onClick={e => e.stopPropagation()}>
                        <button className="edit-btn" onClick={() => alert(`Edit product ${product.name}`)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}


        {['orders', 'customers', 'messages', 'settings'].includes(activeTab) && (
          <div className="tab-content">
            <h2 style={{textTransform:'capitalize'}}>{activeTab} section coming soon...</h2>
          </div>
        )}

        {error && <p style={{color:'red', marginTop:'1rem'}}>{error}</p>}
      </main>
    </div>
  );
};

export default VendorDashboard;
