import React, { useEffect, useState } from 'react';
import '../pages/MyAccount.css';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  return (
    <div className="tab-content">
    <div className="profile-header">
      <div className="profile-info">
        <h2>My Orders</h2>
        <p className="profile-subtitle">View your recent orders</p>
      </div>
      </div>

      <div className="form-section">
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && orders.length === 0 && <p>No orders found.</p>}

        <ul className="order-list">
          {orders.map(order => (
            <li key={order.id} className="order-item">
              <h4>Order </h4>
              <p><strong>Business:</strong> {order.business?.name || 'N/A'}</p>
              <p><strong>Total:</strong> ₦{Number(order.total).toLocaleString()}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p>
                <strong>Address:</strong>{' '}
                {order.address?.street}, {order.address?.city}, {order.address?.state}
              </p>

              <h5>Items:</h5>
              <ul className="order-product-list">
                {order.items?.map((item) => (
                  <li key={item.id} className="order-product-item" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <img
                      src={item.product?.image_url || '/default-product.png'}
                      alt={item.product?.name}
                      className="product-thumb"
                      style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 10 }}
                    />
                    <div>
                      {item.quantity} x {item.product?.name}
                      <br />
                      ₦{Number(item.price).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Orders;
