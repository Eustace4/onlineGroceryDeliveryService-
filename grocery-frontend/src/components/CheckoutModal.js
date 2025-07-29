import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaMapMarkerAlt, FaPhone, FaUser, FaTrash } from 'react-icons/fa';
import styles from './CheckoutModal.module.css';
import { useNavigate } from 'react-router-dom';

const CheckoutModal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // New address form state
  const [newAddress, setNewAddress] = useState({
    label: 'home',
    street: '',
    city: '',
    state: '',
    building_name: '',
    door_number: '',
    postal_code: '',
    country: 'Turkey',
    
  });

  // Order form state
  const [orderData, setOrderData] = useState({
    phone: '',
    special_instructions: '',
    payment_method: 'cash'
  });

  const token = localStorage.getItem('auth_token');

  // Fetch user profile and addresses when modal opens
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchUserAddresses();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setOrderData(prev => ({
          ...prev,
          phone: data.user.phone || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userAddresses = Array.isArray(data) ? data : data.data || [];
        setAddresses(userAddresses);
        
        // In fetchUserAddresses function, replace the default address logic:
        if (userAddresses.length > 0) {
            setSelectedAddressId(userAddresses[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Failed to load addresses');
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/addresses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const savedAddress = await response.json();
        setAddresses(prev => [...prev, savedAddress]);
        setSelectedAddressId(savedAddress.id.toString());
        setShowAddressForm(false);
        
        // Reset form with all fields
        setNewAddress({
          label: 'home',
          street: '',
          building_name: '',
          door_number: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'Turkey',
          
        });
        
        alert('✅ Address added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      setError('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    if (!orderData.phone.trim()) {
      setError('Please provide a phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        address: {
          street: addresses.find(addr => addr.id == selectedAddressId)?.street || '',
          city: addresses.find(addr => addr.id == selectedAddressId)?.city || '',
          state: addresses.find(addr => addr.id == selectedAddressId)?.state || '',
          postal_code: addresses.find(addr => addr.id == selectedAddressId)?.postal_code || '',
          country: addresses.find(addr => addr.id == selectedAddressId)?.country || 'Turkey'
        },
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      const response = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const order = await response.json();
        alert('Order placed successfully!');
        
        // Clear cart
        localStorage.removeItem('cart');
        
        // Close modal and redirect
       navigate(-1);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order');
    } finally {
      setLoading(false);
    }
  };


// Replace your return statement with this improved version:

// Replace your return statement with this improved version:

return (
  <div className={styles['checkout-page']}>
    <div className={styles.container}>
      <div className={styles['checkout-header']}>
        <h2>Checkout</h2>
        <button onClick={() => navigate(-1)} className={styles['back-btn']}>
          ← Back to Cart
        </button>
      </div>
      
      <div className={styles['checkout-content']}>
        {error && <div className={styles['error-message']}>{error}</div>}

        {/* Order Summary */}
        <div className={styles['order-summary']}>
          <h3>Order Summary</h3>
          <div className={styles['cart-items-summary']}>
            {cartItems.map(item => (
              <div key={item.id} className={styles['checkout-item']}>
                <span>{item.name || 'Unknown Item'}</span>
                <span>×{item.quantity || 0}</span>
                <span>₺{((parseFloat(item.price) || 0) * (item.quantity || 0)).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className={styles['order-total']}>
            <strong>Total: ₺{cartTotal.toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className={styles['checkout-form']}>
          {/* Customer Info */}
          <div className={styles['form-section']}>
            <h3><FaUser /> Customer Information</h3>
            <div className={styles['form-group']}>
              <label>Full Name</label>
              <input
                type="text"
                value={userProfile?.name || ''}
                disabled
                className={styles['form-input']}
              />
            </div>
            <div className={styles['form-group']}>
              <label>Phone Number *</label>
              <input
                type="tel"
                value={orderData.phone}
                onChange={(e) => setOrderData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className={styles['form-input']}
                required
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className={styles['form-section']}>
            <div className={styles['section-header']}>
              <h3><FaMapMarkerAlt /> Delivery Address</h3>
              <button
                type="button"
                onClick={() => setShowAddressForm(!showAddressForm)}
                className={styles['add-address-btn']}
              >
                <FaPlus /> Add New Address
              </button>
            </div>

            {addresses.length > 0 && (
              <div className={styles['form-group']}>
                <label>Select Address *</label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className={styles['form-select']}
                  required
                >
                  <option value="">Choose an address</option>
                  {addresses.map(address => (
                    <option key={address.id} value={address.id}>
                      {(address.label || '').toUpperCase()} - {address.street || ''}
                      {address.building_name && `, ${address.building_name}`}
                      {address.door_number && ` #${address.door_number}`}
                      , {address.city || ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {addresses.length === 0 && !showAddressForm && (
              <div className={styles['form-group']}>
                <label>Delivery Address *</label>
                <p style={{color: '#666', fontStyle: 'italic', padding: '12px', background: '#f8f9fa', borderRadius: '6px'}}>
                  📍 No saved addresses found. Please add a new address to continue.
                </p>
              </div>
            )}

            {showAddressForm && (
              <div className={styles['new-address-form']}>
                <h4>Add New Address</h4>
                
                <div className={styles['form-group']}>
                  <label>Address Type</label>
                  <select
                    value={newAddress.label}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, type: e.target.value }))}
                    className={styles['form-select']}
                  >
                    <option value="home">🏠 Home</option>
                    <option value="work">🏢 Work</option>
                    <option value="other">📍 Other</option>
                  </select>
                </div>

                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label>Street Address *</label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Enter street address"
                      className={styles['form-input']}
                      required
                    />
                  </div>
                  <div className={styles['form-group']}>
                    <label>Building Name</label>
                    <input
                      type="text"
                      value={newAddress.building_name}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, building_name: e.target.value }))}
                      placeholder="Building or complex name"
                      className={styles['form-input']}
                    />
                  </div>
                </div>

                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label>Door/Apartment Number</label>
                    <input
                      type="text"
                      value={newAddress.door_number}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, door_number: e.target.value }))}
                      placeholder="Door or apartment number"
                      className={styles['form-input']}
                    />
                  </div>
                  <div className={styles['form-group']}>
                    <label>City *</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                      className={styles['form-input']}
                      required
                    />
                  </div>
                </div>

                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label>State/Province</label>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state or province"
                      className={styles['form-input']}
                    />
                  </div>
                  <div className={styles['form-group']}>
                    <label>Postal Code</label>
                    <input
                      type="text"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                      placeholder="Enter postal code"
                      className={styles['form-input']}
                    />
                  </div>
                </div>

                <div className={styles['form-group']}>
                  <label>Country</label>
                  <select
                    value={newAddress.country}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                    className={styles['form-select']}
                  >
                    <option value="Turkey">🇹🇷 Turkey</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Italy">🇮🇹 Italy</option>
                    <option value="Spain">🇪🇸 Spain</option>
                    <option value="Other">🌍 Other</option>
                  </select>
                </div>              

                <div className={styles['address-form-actions']}>
                  <button
                    type="button"
                    onClick={handleAddNewAddress}
                    disabled={loading || !newAddress.street || !newAddress.city}
                    className={styles['save-address-btn']}
                  >
                    {loading ? '⏳ Saving...' : '💾 Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setNewAddress({
                        label: 'home',
                        street: '',
                        building_name: '',
                        door_number: '',
                        city: '',
                        state: '',
                        postal_code: '',
                        country: 'Turkey',
                        is_default: false
                      });
                    }}
                    className={styles['cancel-btn']}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className={styles['form-section']}>
            <h3>📝 Special Instructions</h3>
            <div className={styles['form-group']}>
              <textarea
                value={orderData.special_instructions}
                onChange={(e) => setOrderData(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder="Any special delivery instructions..."
                className={styles['form-textarea']}
                rows="3"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className={styles['form-section']}>
            <h3>💳 Payment Method</h3>
            <div className={styles['payment-options']}>
              <label className={`${styles['payment-option']} ${orderData.payment_method === 'cash' ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={orderData.payment_method === 'cash'}
                  onChange={(e) => setOrderData(prev => ({ ...prev, payment_method: e.target.value }))}
                />
                <div className={styles['payment-icon']}>💵</div>
                <span className={styles['payment-label']}>Cash on Delivery</span>
              </label>
              <label className={`${styles['payment-option']} ${orderData.payment_method === 'card' ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="card"
                  checked={orderData.payment_method === 'card'}
                  onChange={(e) => setOrderData(prev => ({ ...prev, payment_method: e.target.value }))}
                />
                <div className={styles['payment-icon']}>💳</div>
                <span className={styles['payment-label']}>Credit/Debit Card</span>
              </label>
              <label className={`${styles['payment-option']} ${orderData.payment_method === 'online' ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="online"
                  checked={orderData.payment_method === 'online'}
                  onChange={(e) => setOrderData(prev => ({ ...prev, payment_method: e.target.value }))}
                />
                <div className={styles['payment-icon']}>🌐</div>
                <span className={styles['payment-label']}>Online Payment</span>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <div className={styles['checkout-actions']}>
            <button
              type="submit"
              disabled={loading || !selectedAddressId}
              className={styles['place-order-btn']}
            >
              {loading ? '⏳ Placing Order...' : `🛒 Place Order (₺${cartTotal.toFixed(2)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default CheckoutModal;