import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

// API configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Adjust this to your Laravel API URL

// API utility functions
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      return;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    activeCustomers: 0,
    vendors: 0,
    productsInStock: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  });

  // State for entity data
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [viewedProduct, setViewedProduct] = useState(null);
  const [productModalType, setProductModalType] = useState('');
  const [productFormData, setProductFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [viewedItem, setViewedItem] = useState(null);

  // User Management Functions
  const [viewedUser, setViewedUser] = useState(null);

  const handleViewUser = (user) => {
    setViewedUser(user);
    setShowModal(true);
    setModalType('viewUser');
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(userData);
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all data concurrently
      const [usersData, businessesData, categoriesData, productsData] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/businesses'),
        apiRequest('/categories'),
        apiRequest('/products')
      ]);

      setUsers(usersData);
      setBusinesses(businessesData);
      setCategories(categoriesData);
      setProducts(productsData);

      // Calculate dashboard metrics
      const vendors = usersData.filter(u => u.role === 'vendor').length;
      const customers = usersData.filter(u => u.role === 'customer').length;
      setDashboardData({
        totalOrders: 0, // You'll need to create an orders endpoint
        activeCustomers: customers,
        vendors: vendors,
        productsInStock: productsData.length,
        dailyRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/login');
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiRequest(`/users/${userId}`, { method: 'DELETE' });
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };
  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
    setViewedItem(null);
  };

  // Business Management Functions

  const [viewedBusiness, setViewedBusiness] = useState(null);
  const [viewedProductsBusiness, setViewedProductsBusiness] = useState(null);
  const [businessProducts, setBusinessProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Enhanced: When viewing a business, also fetch and show its products
  const handleViewBusiness = async (business) => {
    setViewedBusiness(business);
    setShowModal(true);
    setModalType('viewBusiness');
    // Fetch products for this business
    setViewedProductsBusiness(business); // for modal fallback
    setBusinessProducts([]);
    setProductsError(null);
    setProductsLoading(true);
    try {
      const products = await apiRequest(`/businesses/${business.id}/products`);
      setBusinessProducts(Array.isArray(products) ? products : (products.products || []));
    } catch (err) {
      setProductsError('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDeleteBusiness = async (businessId) => {
    if (window.confirm('Are you sure you want to delete this business?')) {
      try {
        await apiRequest(`/businesses/${businessId}`, { method: 'DELETE' });
        setBusinesses(businesses.filter(business => business.id !== businessId));
      } catch (error) {
        console.error('Error deleting business:', error);
        alert('Failed to delete business');
      }
    }
  };

  const handleEditBusiness = (business) => {
    setEditingItem(business);
    setFormData({
      name: business.name,
      email: business.email,
      address: business.address,
      phone: business.phone
    });
    setModalType('editBusiness');
    setShowModal(true);
  };

  // Category Management Functions
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await apiRequest(`/categories/${categoryId}`, { method: 'DELETE' });
        setCategories(categories.filter(category => category.id !== categoryId));
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    }
  };

  const handleAddCategory = () => {
    setEditingItem(null);
    setFormData({ name: '' });
    setModalType('addCategory');
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setFormData({ name: category.name });
    setModalType('editCategory');
    setShowModal(true);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing category
        const updatedCategory = await apiRequest(`/categories/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setCategories(categories.map(cat => 
          cat.id === editingItem.id ? { ...cat, ...updatedCategory.category } : cat
        ));
      } else {
        // Create new category
        const newCategory = await apiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setCategories([...categories, newCategory.category]);
      }
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleSubmitBusiness = async (e) => {
    e.preventDefault();
    try {
      const updatedBusiness = await apiRequest(`/businesses/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setBusinesses(businesses.map(business => 
        business.id === editingItem.id ? { ...business, ...updatedBusiness.business } : business
      ));
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error updating business:', error);
      alert('Failed to update business');
    }
  };

  // --- Analytics State ---
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  // Fetch analytics when Analytics tab is active
  useEffect(() => {
    if (activeTab === 'analytics') {
      setMetricsLoading(true);
      setMetricsError(null);
      apiRequest('/admin/metrics')
        .then(data => setMetrics(data))
        .catch(() => setMetricsError('Failed to load analytics'))
        .finally(() => setMetricsLoading(false));
    }
  }, [activeTab]);

  // --- Analytics Card Icons ---
  const metricIcons = {
    totalOrders: '🛒',
    totalRevenue: '💰',
    activeRiders: '🚴',
    avgDeliveryTime: '⏱️',
    cancelledOrders: '❌',
    failedOrders: '⚠️',
  };

  // --- Analytics Colors ---
  const metricColors = {
    totalOrders: '#4f8cff',
    totalRevenue: '#2ecc71',
    activeRiders: '#f1c40f',
    avgDeliveryTime: '#e67e22',
    cancelledOrders: '#e74c3c',
    failedOrders: '#8e44ad',
  };

  // --- Analytics Render ---
  // (Removed duplicate renderAnalytics declaration)

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'businesses', label: 'Business Management', icon: '🏪' },
    { id: 'products', label: 'Product Management', icon: '🛒' },
    { id: 'categories', label: 'Category Management', icon: '🏷️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];
  // Product Management Functions

  // Product Management Functions
  const handleViewProduct = (product) => {
    setViewedProduct(product);
    setProductModalType('view');
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingItem(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_name: product.category?.name || '',
      business_id: product.business?.id || product.business_id || '',
    });
    setProductModalType('edit');
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiRequest(`/products/${productId}`, { method: 'DELETE' });
        setProducts(products.filter(product => product.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleAddProduct = () => {
    setEditingItem(null);
    setProductFormData({ name: '', description: '', price: '', stock: '', category_name: '', business_id: '' });
    setProductModalType('add');
    setShowModal(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (productModalType === 'edit' && editingItem) {
        // Update existing product
        const updatedProduct = await apiRequest(`/products/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(productFormData)
        });
        setProducts(products.map(prod => prod.id === editingItem.id ? { ...prod, ...updatedProduct.product } : prod));
      } else if (productModalType === 'add') {
        // Create new product
        const newProduct = await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(productFormData)
        });
        setProducts([...products, newProduct.product]);
      }
      setShowModal(false);
      setProductFormData({});
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const renderProducts = () => (
    <div className="table-section">
      <div className="section-header">
        <h2>Product Management</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddProduct}>Add Product</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Business</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(p =>
              p.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category?.name || 'N/A'}</td>
                <td>{product.price}</td>
                <td>{product.stock ?? product.quantity ?? 'N/A'}</td>
                <td>{product.business?.name || product.business_id || 'N/A'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" onClick={() => handleViewProduct(product)}>View</button>
                    <button className="btn-edit" onClick={() => handleEditProduct(product)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's what's happening with your platform today.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">📊</div>
          <div className="metric-info">
            <h3>{dashboardData.totalOrders}</h3>
            <p>Total Orders Today</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">👥</div>
          <div className="metric-info">
            <h3>{dashboardData.activeCustomers}</h3>
            <p>Active Customers</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">🏪</div>
          <div className="metric-info">
            <h3>{dashboardData.vendors}</h3>
            <p>Registered Vendors</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">📦</div>
          <div className="metric-info">
            <h3>{dashboardData.productsInStock}</h3>
            <p>Products in Stock</p>
          </div>
        </div>
      </div>

      <div className="revenue-section">
        <div className="revenue-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">👤</span>
              <span className="activity-text">New user registered</span>
              <span className="activity-time">2 hours ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🏪</span>
              <span className="activity-text">Business application submitted</span>
              <span className="activity-time">5 hours ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📦</span>
              <span className="activity-text">New product added</span>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === '' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });

    return (
      <div className="table-section">
        <div className="section-header">
          <h2>User Management</h2>
          <div className="header-actions">
            <input 
              type="text" 
              placeholder="Search users..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="rider">Rider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => handleViewUser(user)}>View</button>
                      <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBusinesses = () => (
    <div className="table-section">
      <div className="section-header">
        <h2>Business Management</h2>
        <div className="header-actions">
          <input 
            type="text" 
            placeholder="Search businesses..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(business => (
              <tr key={business.id}>
                <td>{business.id}</td>
                <td>{business.name}</td>
                <td>{business.email}</td>
                <td>{business.phone}</td>
                <td>{business.address}</td>
                <td>{
                  business.vendor?.name
                    ? business.vendor.name
                    : business.vendor_id
                      ? (() => {
                          const owner = users.find(u => u.id === business.vendor_id);
                          return owner ? owner.name : 'Unknown Owner';
                        })()
                      : 'N/A'
                }</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" onClick={() => handleViewBusiness(business)}>View</button>
                    <button className="btn-edit" onClick={() => handleEditBusiness(business)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteBusiness(business.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="table-section">
      <div className="section-header">
        <h2>Category Management</h2>
        <div className="header-actions">
          <input 
            type="text" 
            placeholder="Search categories..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddCategory}>Add Category</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())).map(category => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{new Date(category.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEditCategory(category)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteCategory(category.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- Analytics Render ---
  const renderAnalytics = () => {
    if (metricsLoading) return <div>Loading analytics...</div>;
    if (metricsError) return <div style={{ color: 'red' }}>{metricsError}</div>;
    if (!metrics) return null;
    return (
      <div className="analytics-section" style={{padding: '24px'}}>
        <h2 style={{marginBottom: 24}}>📈 Business Analytics</h2>
        <div className="metrics-cards" style={{display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32}}>
          {Object.entries({
            totalOrders: metrics.totalOrders,
            totalRevenue: `₱${metrics.totalRevenue}`,
            activeRiders: metrics.activeRiders,
            avgDeliveryTime: `${metrics.avgDeliveryTime} min`,
            cancelledOrders: metrics.cancelledOrders,
            failedOrders: metrics.failedOrders
          }).map(([key, value]) => (
            <div key={key} className="metric-card" style={{
              background: metricColors[key],
              color: '#fff',
              borderRadius: 16,
              padding: '24px 32px',
              minWidth: 180,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 20
            }}>
              <div style={{fontSize: 36, marginBottom: 8}}>{metricIcons[key]}</div>
              <div style={{fontWeight: 700, fontSize: 28}}>{value}</div>
              <div style={{fontSize: 15, marginTop: 4, opacity: 0.85}}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div>
            </div>
          ))}
        </div>

        {/* Top Selling Products Bar Chart */}
        <h3 style={{marginTop: 32}}>🏆 Top Selling Products</h3>
        <div style={{maxWidth: 600, marginBottom: 32}}>
          {metrics.topProducts && metrics.topProducts.length > 0 ? metrics.topProducts.map(p => (
            <div key={p.id} style={{marginBottom: 12}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{width: 160}}>{p.name}</span>
                <div style={{background: '#4f8cff', height: 18, width: `${Math.max(10, p.total_sold * 8)}px`, borderRadius: 8, margin: '0 12px'}}></div>
                <span style={{fontWeight: 600}}>{p.total_sold} sold</span>
              </div>
            </div>
          )) : <div style={{color: '#888'}}>No data</div>}
        </div>

        {/* Revenue by Business Bar Chart */}
        <h3>💼 Revenue by Business</h3>
        <div style={{maxWidth: 600, marginBottom: 32}}>
          {metrics.revenueByBusiness && metrics.revenueByBusiness.length > 0 ? metrics.revenueByBusiness.map(b => (
            <div key={b.id} style={{marginBottom: 12}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{width: 160}}>{b.name}</span>
                <div style={{background: '#2ecc71', height: 18, width: `${Math.max(10, b.revenue / 10)}px`, borderRadius: 8, margin: '0 12px'}}></div>
                <span style={{fontWeight: 600}}>₱{b.revenue}</span>
              </div>
            </div>
          )) : <div style={{color: '#888'}}>No data</div>}
        </div>

        {/* Customer Growth Line Chart (simple dots/lines) */}
        <h3>📈 Customer Growth (last 6 months)</h3>
        <div style={{maxWidth: 600, marginBottom: 32, padding: '12px 0'}}>
          {metrics.customerGrowth && metrics.customerGrowth.length > 0 ? (
            <div style={{display: 'flex', alignItems: 'flex-end', height: 80, gap: 16}}>
              {metrics.customerGrowth.slice().reverse().map((cg, idx, arr) => {
                const max = Math.max(...arr.map(c => c.count));
                return (
                  <div key={cg.month} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <div style={{background: '#e67e22', width: 18, height: `${(cg.count / (max || 1)) * 60}px`, borderRadius: 6, marginBottom: 4}}></div>
                    <div style={{fontSize: 13, color: '#555'}}>{cg.month.slice(2)}</div>
                    <div style={{fontSize: 13, color: '#222', fontWeight: 600}}>{cg.count}</div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{color: '#888'}}>No data</div>}
        </div>

        {/* Rider Performance Table */}
        <h3>🚴 Rider Performance</h3>
        <div style={{overflowX: 'auto', maxWidth: 700}}>
          <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'}}>
            <thead>
              <tr style={{background: '#f8f8f8'}}>
                <th style={{padding: '10px 16px', textAlign: 'left'}}>Rider</th>
                <th style={{padding: '10px 16px', textAlign: 'center'}}>Deliveries</th>
                <th style={{padding: '10px 16px', textAlign: 'center'}}>Avg Delivery Time (min)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.riderPerformance && metrics.riderPerformance.length > 0 ? metrics.riderPerformance.map(r => (
                <tr key={r.id}>
                  <td style={{padding: '10px 16px'}}>{r.name}</td>
                  <td style={{padding: '10px 16px', textAlign: 'center'}}>{r.deliveries}</td>
                  <td style={{padding: '10px 16px', textAlign: 'center'}}>{r.avgDeliveryTime}</td>
                </tr>
              )) : <tr><td colSpan={3} style={{color: '#888', textAlign: 'center'}}>No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'businesses':
        return renderBusinesses();
      case 'products':
        return renderProducts();
      case 'categories':
        return renderCategories();
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return <div className="coming-soon">System Settings - Coming Soon</div>;
      default:
        return renderDashboard();
    }
  };

  // Modal rendering function
  const renderModal = () => {
    if (!showModal) return null;

    // Product Modals
    if (productModalType === 'view' && viewedProduct) {
      const closeProductModal = () => {
        setShowModal(false);
        setTimeout(() => {
          setViewedProduct(null);
          setProductModalType('');
        }, 200); // allow modal close animation if any
      };
      return (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Product Details</h3>
              <button className="modal-close" onClick={closeProductModal}>×</button>
            </div>
            <div className="modal-body">
              <div><strong>ID:</strong> {viewedProduct.id}</div>
              <div><strong>Name:</strong> {viewedProduct.name}</div>
              <div><strong>Category:</strong> {viewedProduct.category?.name || 'N/A'}</div>
              <div><strong>Price:</strong> {viewedProduct.price}</div>
              <div><strong>Stock:</strong> {viewedProduct.stock ?? viewedProduct.quantity ?? 'N/A'}</div>
              <div><strong>Business:</strong> {viewedProduct.business?.name || viewedProduct.business_id || 'N/A'}</div>
              <div><strong>Description:</strong> {viewedProduct.description || 'N/A'}</div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeProductModal}>Close</button>
            </div>
          </div>
        </div>
      );
    }

    if ((productModalType === 'edit' || productModalType === 'add') && (showModal)) {
      return (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{productModalType === 'add' ? 'Add New Product' : 'Edit Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={productFormData.name || ''}
                    onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={productFormData.description || ''}
                    onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    value={productFormData.price || ''}
                    onChange={e => setProductFormData({ ...productFormData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    value={productFormData.stock || ''}
                    onChange={e => setProductFormData({ ...productFormData, stock: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={productFormData.category_name || ''}
                    onChange={e => setProductFormData({ ...productFormData, category_name: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Business</label>
                  <select
                    value={productFormData.business_id || ''}
                    onChange={e => setProductFormData({ ...productFormData, business_id: e.target.value })}
                    required
                  >
                    <option value="">Select Business</option>
                    {businesses.map(biz => (
                      <option key={biz.id} value={biz.id}>{biz.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {productModalType === 'add' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // ...existing code for user, business, and category modals...
    if (modalType === 'viewUser' && viewedUser) {
      return (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div><strong>ID:</strong> {viewedUser.id}</div>
              <div><strong>Name:</strong> {viewedUser.name}</div>
              <div><strong>Email:</strong> {viewedUser.email}</div>
              <div><strong>Role:</strong> {viewedUser.role}</div>
              <div><strong>Created:</strong> {new Date(viewedUser.created_at).toLocaleString()}</div>
              {/* Add more fields as needed */}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      );
    }

    if (modalType === 'viewBusiness' && viewedBusiness) {
      // Enhanced: Show business details AND products in one modal
      const closeBusinessModal = () => {
        setShowModal(false);
        setTimeout(() => {
          setViewedBusiness(null);
          setViewedProductsBusiness(null);
          setModalType('');
        }, 200);
      };
      return (
        <div className="modal-overlay" onClick={closeBusinessModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Business Details</h3>
              <button className="modal-close" onClick={closeBusinessModal}>×</button>
            </div>
            <div className="modal-body">
              <div><strong>ID:</strong> {viewedBusiness.id}</div>
              <div><strong>Name:</strong> {viewedBusiness.name}</div>
              <div><strong>Email:</strong> {viewedBusiness.email}</div>
              <div><strong>Phone:</strong> {viewedBusiness.phone}</div>
              <div><strong>Address:</strong> {viewedBusiness.address}</div>
              <div><strong>Owner:</strong> {
                viewedBusiness.vendor?.name
                  ? viewedBusiness.vendor.name
                  : viewedBusiness.vendor_id
                    ? (() => {
                        const owner = users.find(u => u.id === viewedBusiness.vendor_id);
                        return owner ? owner.name : 'Unknown Owner';
                      })()
                    : 'N/A'
              }</div>
              <div><strong>Created:</strong> {new Date(viewedBusiness.created_at).toLocaleString()}</div>
              <hr style={{margin: '1em 0'}} />
              <h4>Products for this Business</h4>
              {productsLoading && <div>Loading products...</div>}
              {productsError && <div style={{color: 'red'}}>{productsError}</div>}
              {!productsLoading && !productsError && businessProducts.length === 0 && (
                <div>No products found for this business.</div>
              )}
              {!productsLoading && !productsError && businessProducts.length > 0 && (
                <table className="data-table" style={{marginTop: '0.5em'}}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessProducts.map(product => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{product.category?.name || 'N/A'}</td>
                        <td>{product.price}</td>
                        <td>{product.stock ?? product.quantity ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeBusinessModal}>Close</button>
            </div>
          </div>
        </div>
      );
    }

    // ...existing code for category/business modals...
    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === 'addCategory' && 'Add New Category'}
              {modalType === 'editCategory' && 'Edit Category'}
              {modalType === 'editBusiness' && 'Edit Business'}
            </h3>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          
          <form onSubmit={modalType.includes('Category') ? handleSubmitCategory : handleSubmitBusiness}>
            <div className="modal-body">
              {modalType.includes('Category') && (
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              )}
              
              {modalType === 'editBusiness' && (
                <>
                  <div className="form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            {/*<span className="logo-icon">🛒</span>*/}
            <span className="logo-text">Grocery delivery Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>

      {renderModal()}
    </div>
  );
}