import React, { useState, useEffect } from 'react';
import '../pages/MyAccount.css';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function AddressSection({ token }) {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    street: '',
    building_name: '',
    door_number: '',
    latitude: '',
    longitude: '',
  });
  const [mapCoords, setMapCoords] = useState([6.5244, 3.3792]); // default Lagos
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_KEY;

  useEffect(() => {
    fetch('http://localhost:8000/api/addresses', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then(setAddresses)
      .catch(() => setError('Failed to fetch addresses'))
      .finally(() => setLoading(false));
  }, [token]);

  // 🔁 Geocode when user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (form.street.length > 4) {
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(form.street)}&key=${OPENCAGE_API_KEY}`)
          .then(res => res.json())
          .then(data => {
            const location = data.results?.[0]?.geometry;
            if (location) {
              setMapCoords([location.lat, location.lng]);
              setForm(prev => ({ ...prev, latitude: location.lat, longitude: location.lng }));
            }
          })
          .catch(() => console.log("Failed to fetch location"));
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [form.street, OPENCAGE_API_KEY]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    if (!form.street.trim()) return;

    const response = await fetch('http://localhost:8000/api/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setAddresses([...addresses, data]);
      setForm({ street: '', building_name: '', door_number: '', latitude: '', longitude: '' });
    } else {
      alert(data.message || 'Failed to add address');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    const res = await fetch(`http://localhost:8000/api/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAddresses(addresses.filter((a) => a.id !== id));
    } else {
      alert('Failed to delete');
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setMapCoords([latitude, longitude]);
      setForm(prev => ({ ...prev, latitude, longitude }));

      try {
        const res = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`
        );
        const data = await res.json();

        if (data.results?.length > 0) {
          const formatted = data.results[0].formatted;
          setForm(prev => ({ ...prev, street: formatted }));
        } else {
          alert('Could not retrieve address');
        }
      } catch (err) {
        alert('Error fetching address');
      }
    }, () => {
      alert('Permission denied or error getting location');
    });
  };

  return (
    <div className="tab-content">
      <div className="profile-info">
        <h2>My Addresses</h2>
        <p className="profile-subtitle">Manage your delivery addresses</p>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label>Street Address</label>
          <input name="street" value={form.street} onChange={handleInputChange} />

          <label>Building Name</label>
          <input name="building_name" value={form.building_name} onChange={handleInputChange} />

          <label>Door Number</label>
          <input name="door_number" value={form.door_number} onChange={handleInputChange} />

          <button className="btn btn-primary" onClick={handleAdd}>
            Add Address
          </button>
          <button className="btn btn-secondary" onClick={handleUseCurrentLocation}>
            Use Current Location
          </button>
        </div>

        {/* MAP PREVIEW */}
        <div className="map-container">
          <MapContainer center={mapCoords} zoom={16} scrollWheelZoom={false} style={{ height: 300, marginTop: 10 }}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={mapCoords} icon={markerIcon} />
          </MapContainer>
        </div>

        <h4 style={{ marginTop: '20px' }}>Saved Addresses</h4>
        {loading ? (
          <p>Loading...</p>
        ) : addresses.length === 0 ? (
          <p>No addresses yet.</p>
        ) : (
          <ul className="address-list">
            {addresses.map((address) => (
              <li key={address.id} className="address-item">
                <div>
                  <strong>{address.street}</strong><br />
                  {address.building_name}, Door: {address.door_number}
                </div>
                <button className="btn btn-danger" onClick={() => handleDelete(address.id)}>
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
