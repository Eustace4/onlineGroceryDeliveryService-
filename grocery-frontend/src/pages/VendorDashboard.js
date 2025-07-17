import React, { useState, useEffect } from 'react';
import {
  Store,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  MessageSquare,
  Settings,
  Plus,
  LogOut
} from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import './MyAccount.css';

const geoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

const countryRevenues = {
  Sudan: 1688908.13,
  USA: 900000,
  India: 500000,
};
const maxRevenue = Math.max(...Object.values(countryRevenues));
const colorScale = scaleLinear().domain([0, maxRevenue]).range(['#bbf7d0', '#16a34a']);

const WorldMap = () => (
  <ComposableMap projection="geoMercator" width={800} height={400}>
    <Geographies geography={geoUrl}>
      {({ geographies }) =>
        geographies.map((geo) => {
          const revenue = countryRevenues[geo.properties.name] || 0;
          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={colorScale(revenue)}
              stroke="#ffffff"
              strokeWidth={0.5}
            />
          );
        })
      }
    </Geographies>
  </ComposableMap>
);

const API_BASE = 'http://localhost:8000/api';

const VendorDashboard = ({ token }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/vendor/businesses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBusinesses(data);
        if (data.length > 0) {
          setSelectedBusiness(data[0]);
        }
      })
      .catch(err => {
        console.error('Error fetching businesses:', err);
        setError('Failed to fetch businesses.');
      });
  }, [token]);

  useEffect(() => {
    if (!selectedBusiness) return;
    fetch(`${API_BASE}/businesses/${selectedBusiness.id}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setProducts)
      .catch(err => {
        console.error('Error fetching products:', err);
        setError('Failed to fetch products.');
      });
  }, [selectedBusiness, token]);

  const totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue || 0), 0);

  return (
    <div className="myaccount-container">
      <aside className="myaccount-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-avatar">
            <Store className="w-full h-full text-white" />
          </div>
          <div className="sidebar-user-info">
            <h4>VendorHub</h4>
            <span className="user-email">vendor@example.com</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <ShoppingCart /> Dashboard
          </button>
          <button onClick={() => setActiveTab('businesses')} className={`nav-item ${activeTab === 'businesses' ? 'active' : ''}`}>
            <Store /> My Businesses
          </button>
          <button onClick={() => setActiveTab('products')} className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}>
            <Package /> Products
          </button>
          <button onClick={() => setActiveTab('orders')} className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
            <DollarSign /> Orders
          </button>
          <button onClick={() => setActiveTab('customers')} className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}>
            <Users /> Customers
          </button>
          <button onClick={() => setActiveTab('messages')} className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}>
            <MessageSquare /> Messages
          </button>
          <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <Settings /> Settings
          </button>
        </nav>

        <button className="logout-btn">
          <LogOut /> Logout
        </button>
      </aside>

      <main className="myaccount-content">
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-gray-600 mb-6">Welcome back! Here's your summary.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-600 mb-1">Total Businesses</p>
                <p className="text-2xl font-bold text-gray-900">{businesses.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{businesses.reduce((sum, b) => sum + (b.products || 0), 0)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Top Countries</h2>
              <WorldMap />
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          <div className="tab-content">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Businesses</h2>
              <button className="add-btn" onClick={() => alert('Show add business modal')}>
                <Plus className="w-4 h-4 mr-1" /> Add Business
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map(b => (
                <div
                  key={b.id}
                  className={`bg-white p-4 border rounded-lg shadow-sm cursor-pointer ${selectedBusiness?.id === b.id ? 'bg-green-100' : ''}`}
                  onClick={() => setSelectedBusiness(b)}
                >
                  <h3 className="text-lg font-semibold">{b.name}</h3>
                  <p><strong>Location:</strong> {b.location}</p>
                  <p><strong>Revenue:</strong> ₦{b.revenue?.toLocaleString() || 0}</p>
                  <p><strong>Products:</strong> {b.products}</p>
                  <p><strong>Status:</strong> {b.status}</p>
                  <button className="mt-2 text-sm text-blue-600 underline" onClick={() => alert('Show Add Product Modal')}>
                    Add Product
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="tab-content">
            <h2 className="text-xl font-bold mb-4">Products for <span className="text-green-600">{selectedBusiness?.name}</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="p-4 border rounded shadow bg-white">
                  <img
                    src={`http://localhost:8000/storage/${product.image}`}
                    alt={product.name}
                    className="w-full h-32 object-cover mb-2 rounded"
                  />
                  <h4 className="font-semibold">{product.name}</h4>
                  <p>₦{product.price}</p>
                  <p className="text-sm text-gray-500">{product.category?.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {['orders', 'customers', 'messages', 'settings'].includes(activeTab) && (
          <div className="tab-content">
            <h2 className="text-2xl font-bold capitalize">{activeTab} section coming soon...</h2>
          </div>
        )}

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </main>
    </div>
  );
};

export default VendorDashboard;
