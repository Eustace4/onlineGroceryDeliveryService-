
import React, { useState } from 'react';
import {
  BarChart3,
  Store,
  Users,
  MessageSquare,
  Settings,
  Plus,
  Search,
  Bell,
  Eye,
  MapPin,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  X
} from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

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

const VendorDashboard = () => {
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const businesses = [
    { id: 1, name: 'Downtown Café', revenue: 12500, location: 'New York', status: 'Active', products: 25 },
    { id: 2, name: 'Mall Store', revenue: 8900, location: 'Los Angeles', status: 'Active', products: 18 },
    { id: 3, name: 'Food Truck', revenue: 5600, location: 'Chicago', status: 'Active', products: 12 },
  ];

  const totalRevenue = businesses.reduce((sum, business) => sum + business.revenue, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">VendorHub</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-80"
            />
          </div>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add product</span>
          </button>
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your businesses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Countries</h2>
          <WorldMap />
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
