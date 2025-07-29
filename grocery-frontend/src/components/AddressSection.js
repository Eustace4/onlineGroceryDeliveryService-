import React, { useState, useEffect } from 'react';
import '../pages/MyAccount.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

function MapUpdater({ coords }) {
  const map = useMap();
  
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, 16);
    }
  }, [coords, map]);
  
  return null;
}

export default function AddressSection({ token }) {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    label: 'home',
    street: '',
    building_name: '',
    door_number: '',
    latitude: '',
    longitude: '',
    postal_code: '',
    country: '',
    state: '',
    city: '',
  });
  const [mapCoords, setMapCoords] = useState([35.1264, 33.4299]);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_KEY;

  const fetchAddresses = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const data = await response.json();
      console.log('Fetched addresses:', data);
      setAddresses(data);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch addresses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  useEffect(() => {
    if (showForm && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setGpsCoords(coords);
          setMapCoords(coords);

          // Auto-fill address on open
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${coords[0]}+${coords[1]}&key=${OPENCAGE_API_KEY}`
          );
          const data = await res.json();
          const components = data.results?.[0]?.components;
          const formatted = data.results?.[0]?.formatted;
          if (components) {
            setForm(prev => ({
              ...prev,
              street: formatted,
              latitude: coords[0],
              longitude: coords[1],
              postal_code: components.postcode || 'N/A',
              country: components.country || '',
              state: components.state || components.region || '',
              city: components.city || components.town || components.village || '',
            }));
          }
        },
        (error) => console.error('Error getting GPS:', error),
        { enableHighAccuracy: true }
      );
    }
  }, [showForm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (form.street.length > 4) {
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(form.street)}&key=${OPENCAGE_API_KEY}`)
          .then(res => res.json())
          .then(data => {
            const location = data.results?.[0]?.geometry;
            const components = data.results?.[0]?.components;
            if (location && components) {
              setMapCoords([location.lat, location.lng]);
              setForm(prev => ({
                ...prev,
                latitude: location.lat,
                longitude: location.lng,
                postal_code: components.postcode || 'N/A',
                country: components.country || '',
                state: components.state || '',
                city: components.city || components.town || components.village || '',
              }));
            }
          })
          .catch(() => console.log("Failed to fetch location"));
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [form.street, OPENCAGE_API_KEY]);

  const handleMapClick = async (lat, lng) => {
    setMapCoords([lat, lng]);
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    try {
      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`
      );
      const data = await res.json();
      const components = data.results?.[0]?.components;
      const formatted = data.results?.[0]?.formatted;
      if (components && formatted) {
        setForm(prev => ({
          ...prev,
          street: formatted,
          postal_code: components.postcode || 'N/A',
          country: components.country || '',
          state: components.state || components.region || '',
          city: components.city || components.town || components.village || '',
        }));
      }
    } catch {
      alert('Error fetching address from map click');
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    console.log('Save button clicked'); // Add this
    console.log('Form data:', form); // Add this
    
    if (!form.street.trim()) {
      console.log('No street address provided'); // Add this
      alert('Street address is required');
      return;
    }

    const url = editingId
      ? `http://localhost:8000/api/addresses/${editingId}`
      : 'http://localhost:8000/api/addresses';
    const method = editingId ? 'PUT' : 'POST';

    console.log('Making request:', { url, method, form }); // Add this

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      console.log('Response status:', response.status); // Add this
      
      const contentType = response.headers.get('Content-Type');
      const data = contentType?.includes('application/json') ? await response.json() : await response.text();
      
      console.log('Response data:', data); // Add this

      if (response.ok && data) {
        console.log('Save successful:', data);
        
        // Refetch addresses to ensure sync with database
        await fetchAddresses();
        
        handleCancel();     
      } else {
        console.error('Save failed:', response.status, data); // Add this
        alert(typeof data === 'string' ? data : data.message || 'Failed to save address');
      }
    } catch (err) {
      console.error('Save error:', err); // Add this
      alert('Unexpected error while saving address: ' + err.message);
    }
  };

  const handleEdit = (address) => {
    setForm({
      street: address.street || '',
      building_name: address.building_name || '',
      door_number: address.door_number || '',
      latitude: address.latitude || '',
      longitude: address.longitude || '',
      postal_code: address.postal_code || '',
      country: address.country || '',
      state: address.state || '',
      city: address.city || '',
    });
    setMapCoords([
      parseFloat(address.latitude) || 35.1264,
      parseFloat(address.longitude) || 33.4299,
    ]);
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    const res = await fetch(`http://localhost:8000/api/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      // Refetch addresses to ensure sync with database
      await fetchAddresses();
    } else {
      alert('Failed to delete');
    }
  };

  const handleCancel = () => {
    setForm({
      street: '',
      building_name: '',
      door_number: '',
      latitude: '',
      longitude: '',
      postal_code: '',
      country: '',
      state: '',
      city: '',
    });
    setMapCoords(gpsCoords || [35.1264, 33.4299]);
    setEditingId(null);
    setShowForm(false);
  };

  const safeRender = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="tab-content">
      <div className="profile-header">
        <div className="profile-info">
          <h2>My Addresses</h2>
          <p className="profile-subtitle">Manage your delivery addresses</p>
        </div>
      </div>

      <div className="form-section">
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add Address
          </button>
        )}

        {showForm && (
          <>
            <div className="form-group">
              <label>Street Address</label>
              <input name="street" value={form.street} onChange={handleInputChange} />

              <label>Address Label</label>
              <select name="label" value={form.label} onChange={handleInputChange}>
                  <option value="home">🏠 Home</option>
                  <option value="work">🏢 Work</option>
                  <option value="other">📍 Other</option>
              </select>

              <label>Building Name</label>
              <input name="building_name" value={form.building_name} onChange={handleInputChange} />

              <label>Door Number</label>
              <input name="door_number" value={form.door_number} onChange={handleInputChange} />

              <button className="btn btn-primary" onClick={handleSave}>
                {editingId ? 'Update Address' : 'Save Address'}
              </button>

              <button className="btn btn-danger" onClick={handleCancel} style={{ marginLeft: 10 }}>
                Cancel
              </button>
            </div>

            <div className="map-container">
              <MapContainer center={mapCoords} zoom={16} scrollWheelZoom={false} style={{ height: 300, marginTop: 10 }}>
                <MapUpdater coords={mapCoords} />
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onMapClick={handleMapClick} />

                <Marker position={mapCoords} icon={markerIcon}>
                  <Popup>Selected Location</Popup>
                </Marker>
              </MapContainer>
            </div>
          </>
        )}

        <h4 style={{ marginTop: '20px' }}>Saved Addresses</h4>
        {loading ? (
          <p>Loading...</p>
        ) : addresses.length === 0 ? (
          <p>No addresses yet.</p>
        ) : (
          <ul className="address-list">
            {addresses.map((address, index) => (
              <li key={address.id || `address-${index}`} className="address-item">
                <div>
                  <strong>{safeRender(address.label?.toUpperCase())} - {safeRender(address.street)}</strong>
                  <br />
                  {safeRender(address.building_name)}, Door: {safeRender(address.door_number)}
                </div>

                <button className="btn btn-primary" onClick={() => handleEdit(address)}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(address.id)} style={{ marginLeft: 8 }}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}
