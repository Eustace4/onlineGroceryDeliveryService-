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
  const [categories, setCategories] = useState([]);

  const [error, setError] = useState('');
  const [vendor, setVendor] = useState({ name: '', email: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: '',   // 'product' or 'business'
    id: null,   // ID of the item to delete
  });


  useEffect(() => {
    if (!selectedBusiness || !token) return;

    setLoadingOrders(true);
    fetch(`${API_BASE}/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    })
      .then(res => res.json())
      .then(data => {
        // Filter orders to only show those for the selected business
        const filtered = data.filter(order => order.business_id === selectedBusiness.id);
        setOrders(filtered);
      })
      .catch(() => setError('Failed to fetch orders.'))
      .finally(() => setLoadingOrders(false));
  }, [selectedBusiness, token]);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Failed to fetch users'));
  }, [token]);

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000); // hide after 3 sec
      return () => clearTimeout(timer);
    }
  }, [notification]);



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
      .then(data => setProducts(data.products))
      .catch(() => setError('Failed to fetch products.'))
      .finally(() => setLoadingProducts(false));
  }, [selectedBusiness, token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch categories'))
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    if (!selectedBusiness || !token) return;

    fetch(`/api/businesses/${selectedBusiness.id}/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch orders'))
      .then(data => setOrders(data))
      .catch(err => console.error(err));
  }, [selectedBusiness, token]);



  const totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalProducts = businesses.reduce((sum, b) => sum + (b.products || 0), 0);

  const handleAddProductClick = () => {
    setNewProduct({ name: '', price: '', stock: '', description:'', category_id: '', image: null });
    setEditProductMode(false);
    setEditingProductId(null);
    setShowProductModal(true);
  };

  const handleAddBusinessClick = () => setShowBusinessModal(true);

  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ name: '', email: '', phone: '', address: '', logo: null });

  const [showProductModal, setShowProductModal] = useState(false);
  const [editProductMode, setEditProductMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    category_id: '',
    image: null
  });
  const openDeleteModal = (type, id) => {
    setConfirmModal({ show: true, type, id });
  };

  const handleAddBusiness = async () => {
    const formData = new FormData();
    formData.append('name', newBusiness.name);
    formData.append('email', newBusiness.email);
    formData.append('phone', newBusiness.phone);
    formData.append('address', newBusiness.address);
    if (newBusiness.logo) {
      formData.append('logo', newBusiness.logo);
    }
     if (editMode) {
        formData.append('_method', 'PUT');
      }

    const url = editMode
      ? `${API_BASE}/businesses/${editingBusinessId}`
      : `${API_BASE}/businesses`;

    const method = 'POST';


    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to save business');
      const data = await res.json();

      if (editMode) {
        setBusinesses(prev => prev.map(b => b.id === editingBusinessId ? data.business : b));
      } else {
        setBusinesses(prev => [...prev, data.business]);
      }

      setShowBusinessModal(false);
      setEditMode(false);
      setEditingBusinessId(null);
      setNewBusiness({ name: '', email: '', phone: '', address: '', logo: null });

      // ✅ Show success notification
      setNotification({ message: `Business ${editMode ? 'updated' : 'added'} successfully!`, type: 'success' });

    } catch (err) {
      // ❌ Show error notification
      setNotification({ message: `Error ${editMode ? 'updating' : 'adding'} business.`, type: 'error' });
    }
  };
  
  const assignRiderToOrder = async (orderId, riderId) => {
    if (!riderId) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/assign-rider`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rider_id: riderId })
      });

      if (!res.ok) throw new Error();
      const updated = await res.json();

      setOrders(prev =>
        prev.map(order =>
          order.id === updated.order.id
            ? { ...order, ...updated.order }
            : order
        )
      );

      setNotification({ message: 'Rider assigned successfully!', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to assign rider', type: 'error' });
    }
  };


  const handleAddProduct = async () => {
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('stock', newProduct.stock);
    formData.append('category_name', newProduct.category_name);
    formData.append('business_id', selectedBusiness.id);

    if (newProduct.image) {
      formData.append('image', newProduct.image);
    }
    if (editProductMode) {
      formData.append('_method', 'PUT');
    }

    const url = editProductMode
      ? `${API_BASE}/products/${editingProductId}`
      : `${API_BASE}/products`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to save product');
      const data = await res.json();

      if (editProductMode) {
        setProducts(prev => prev.map(p => p.id === editingProductId ? data.product : p));
      } else {
        setProducts(prev => [...prev, data.product]);
      }

      setShowProductModal(false);
      setEditProductMode(false);
      setEditingProductId(null);
      setNewProduct({ name: '', price: '', stock: '', category_id: '', image: null });

      setNotification({ message: `Product ${editProductMode ? 'updated' : 'added'} successfully!`, type: 'success' });
    } catch (err) {
      setNotification({ message: 'Error saving product.', type: 'error' });
    }
  };

  
  const handleUpdateProduct = async () => {
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('stock', newProduct.stock);
    formData.append('category_name', newProduct.category_name);
    formData.append('description', newProduct.description || '');
    formData.append('business_id', selectedBusiness.id);

    if (newProduct.image) {
      formData.append('image', newProduct.image);
    }

    formData.append('_method', 'PUT');

    try {
      const res = await fetch(`${API_BASE}/products/${editingProductId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to update product');
      const data = await res.json();

      setProducts(prev => prev.map(p => p.id === editingProductId ? data.product : p));
      setShowProductModal(false);
      setEditProductMode(false);
      setEditingProductId(null);
      setNewProduct({ name: '', price: '', stock: '', category_id: '', image: null });

      setNotification({ message: 'Product updated successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Error updating product.', type: 'error' });
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

  const confirmDelete = async () => {
    if (!confirmModal.id) return;

    const endpoint =
      confirmModal.type === 'product'
        ? `${API_BASE}/products/${confirmModal.id}`
        : `${API_BASE}/businesses/${confirmModal.id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error();

      if (confirmModal.type === 'product') {
        setProducts((prev) => prev.filter((p) => p.id !== confirmModal.id));
        setNotification({ message: 'Product deleted successfully!', type: 'success' });
      } else {
        setBusinesses((prev) => prev.filter((b) => b.id !== confirmModal.id));
        if (selectedBusiness?.id === confirmModal.id) setSelectedBusiness(null);
        setNotification({ message: 'Business deleted successfully!', type: 'success' });
      }
    } catch {
      setNotification({
        message: `Failed to delete ${confirmModal.type}.`,
        type: 'error',
      });
    } finally {
      setConfirmModal({ show: false, type: '', id: null }); // Close modal
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
        {notification.message && (
          <div
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              color: notification.type === 'success' ? '#065f46' : '#991b1b',
              backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
              border: notification.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
              textAlign: 'center'
            }}
          >
            {notification.message}
          </div>
        )}

        {activeTab === 'dashboard' && (
        <div className="tab-content">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your summary.</p>
          <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
            {/* existing summary cards */}
            <div style={{background:'white', padding:'1rem', borderRadius:'12px', boxShadow:'0 0 10px rgba(0,0,0,0.1)', flex:1}}>
              <p>Total Revenue</p>
              <p style={{fontWeight:'bold', fontSize:'1.5rem'}}>₺{totalRevenue.toLocaleString()}</p>
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
          <p><strong>Total Revenue:</strong> ₺{biz.total_revenue.toLocaleString()}</p>
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
            {loadingBusinesses ? (
              <p>Loading...</p>
            ) : businesses.length === 0 ? (
              <div className="empty-state">
                <p>No businesses have been added yet.</p>
                <p>Click <strong>"Add Business"</strong> to create your first business.</p>
              </div>
            ) : (
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
                    {/* ✅ Logo display */}
                    {b.logo && (
                      <img
                        src={`http://localhost:8000/storage/${b.logo}`} // full accessible path
                        alt={`${b.name} Logo`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                        }}
                      />
                    )}
                    <h3 style={{marginTop: 0, marginBottom: '0.5rem'}}>{b.name}</h3>
                    <p><strong>Email:</strong> {b.email}</p>
                    <p><strong>Phone:</strong> {b.phone}</p>
                    <p><strong>Address:</strong> {b.address}</p>
                    <div className="business-card-buttons" onClick={e => e.stopPropagation()}>
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditMode(true);
                          setEditingBusinessId(b.id);
                          setNewBusiness({
                            name: b.name,
                            email: b.email,
                            phone: b.phone,
                            address: b.address,
                            logo: null,
                          });
                          setShowBusinessModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteModal('business', b.id)}
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
      {businesses.length === 0 ? (
        <div className="empty-state"> 
          <p>You cannot add products yet.</p>
          <p>Please create a <strong>business</strong> first.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>
              Products for <span style={{ color: '#22c55e' }}>{selectedBusiness?.name || 'Select a business'}</span>
            </h2>
            <button 
              className="add-btn" 
              onClick={handleAddProductClick} 
              disabled={!selectedBusiness} // ✅ Disabled if no business selected
              style={{
                opacity: !selectedBusiness ? 0.5 : 1,
                cursor: !selectedBusiness ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus /> Add Product
            </button>
          </div>

          {!selectedBusiness ? (
            <div style={{ textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '1.1rem' }}>
              <p>ℹ️ Select a business from <strong>My Businesses</strong> to view and manage its products.</p>
            </div>
          ) : loadingProducts ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>No products have been added for <strong>{selectedBusiness?.name}</strong>.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <img
                    src={product.image ? `http://localhost:8000/storage/${product.image}` : '/placeholder.png'}
                    alt={product.name}
                    className="product-image"
                  />
                  <h4 style={{ margin: '0.5rem 0 0.25rem 0' }}>{product.name}</h4>
                  <p style={{ fontWeight: 'bold' }}>₺{product.price}</p>
                  <p className="product-description">{product.description}</p>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {product.category?.name}
                  </p>
                  <p
                    style={{
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
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setEditProductMode(true);
                      setEditingProductId(product.id);
                      setNewProduct({
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        category_id: product.category_id,
                        image: null
                      });
                      setShowProductModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="delete-btn" 
                  onClick={() => openDeleteModal('product', product.id)}
                  >Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </div>
)}

        {activeTab === 'orders' && (
          <div className="tab-content">
            <h2>Orders for {selectedBusiness?.name}</h2>
            {loadingOrders ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p>No orders found for this business.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {orders.map((order, index) => (
                  <div
                    key={order.id}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '1rem',
                      width: '100%',
                      maxWidth: '500px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      flex: '1 1 300px'
                    }}
                  >
                    <h3 style={{ marginBottom: '0.5rem' }}>Order #{order.id}</h3>
                    <p><strong>Customer:</strong> {order.user?.name || 'N/A'}</p>
                    <p><strong>Status:</strong> {order.status}</p>
                    <p><strong>Total:</strong> ₺{order.total}</p>
                    <p><strong>Rider:</strong> {order.rider?.name || 'Unassigned'}</p>

                    <div style={{ marginTop: '0.5rem' }}>
                      <p><strong>Items:</strong></p>
                      <ul style={{ paddingLeft: '1rem' }}>
                        {order.items?.map(item => (
                          <div key={item.id}>
                            {item.product?.name || 'Unknown'} × {item.quantity}
                          </div>
                        ))}
                        
                      </ul>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                        <strong>Assign Rider:</strong>
                      </label>
                      <select
                        onChange={e => assignRiderToOrder(order.id, e.target.value)}
                        defaultValue=""
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #ccc'
                        }}
                      >
                        <option value="">Select Rider</option>
                        {users.filter(u => u.role === 'rider').map(rider => (
                          <option key={rider.id} value={rider.id}>{rider.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}




        {['customers', 'messages', 'settings'].includes(activeTab) && (
          <div className="tab-content">
            <h2 style={{textTransform:'capitalize'}}>{activeTab} section coming soon...</h2>
          </div>
        )}

      {showBusinessModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">{editMode ? 'Edit Business' : 'Add New Business'}</h2>
            <div className="modal-form">
              <input type="text" placeholder="Business Name" value={newBusiness.name} onChange={e => setNewBusiness({ ...newBusiness, name: e.target.value })} />
              <input type="email" placeholder="Email" value={newBusiness.email} onChange={e => setNewBusiness({ ...newBusiness, email: e.target.value })} />
              <input type="text" placeholder="Phone" value={newBusiness.phone} onChange={e => setNewBusiness({ ...newBusiness, phone: e.target.value })} />
              <input type="text" placeholder="Address" value={newBusiness.address} onChange={e => setNewBusiness({ ...newBusiness, address: e.target.value })} />
              <input type="file" accept="image/*" onChange={(e) => setNewBusiness({ ...newBusiness, logo: e.target.files[0] })} />

              <div className="modal-actions">
                <button className="modal-save" onClick={handleAddBusiness}>
                  {editMode ? 'Update' : 'Add'}
                </button>
                <button
                  className="modal-cancel"
                  onClick={() => {
                    setShowBusinessModal(false);
                    setEditMode(false);
                    setEditingBusinessId(null);
                    setNewBusiness({ name: '', email: '', phone: '', address: '', logo: null });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="modal-title">{editProductMode ? 'Edit Product' : 'Add New Product'}</h2>
            <div className="modal-form">
              <input type="text" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              <input type="text" placeholder="description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
              <input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
              <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
                <select
                  className="custom-select spaced-input"
                  value={newProduct.category_name}
                  onChange={(e) => setNewProduct({ ...newProduct, category_name: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              <input type="file" accept="image/*" onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })} />

              <div className="modal-actions">
                <button
                  className="modal-save"
                  onClick={editProductMode ? handleUpdateProduct : handleAddProduct}
                >
                  {editProductMode ? 'Update' : 'Add'}
                </button>
                <button
                  className="modal-cancel"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditProductMode(false);
                    setEditingProductId(null);
                    setNewProduct({ name: '', price: '', description:'', stock: '', category_id: '', image: null });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
       {confirmModal.show && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>
                Are you sure you want to delete this {confirmModal.type}?
              </h3>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={confirmDelete}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmModal({ show: false, type: '', id: null })}
                  style={{
                    backgroundColor: '#e5e7eb',
                    color: '#111827',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p style={{color:'red', marginTop:'1rem'}}>{error}</p>}
      </main>
    </div>
  );
};

export default VendorDashboard;
