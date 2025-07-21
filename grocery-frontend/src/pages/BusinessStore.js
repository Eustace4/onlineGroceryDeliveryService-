import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function BusinessStore() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch business details
    fetch(`http://localhost:8000/api/businesses/${businessId}`)
      .then(res => {
        if (!res.ok) throw new Error('Business not found');
        return res.json();
      })
      .then(data => setBusiness(data))
      .catch(() => setBusiness(null));
      
    // Fetch products of the business
    fetch(`http://localhost:8000/api/businesses/${businessId}/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) return <p>Loading...</p>;
  if (!business) return <p>Business not found</p>;

  return (
    <div className="container">
      <Link to="/">← Back to Home</Link>

      <h1>{business.name}</h1>
      <img
        src={`http://localhost:8000/storage/${business.logo}`}
        alt={business.name}
        style={{ width: '300px', borderRadius: '8px' }}
      />
      <p>{business.description || 'No description available.'}</p>

      <h2>Products</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {products.length === 0 && <p>No products available.</p>}
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', width: '200px' }}>
            <img
              src={`http://localhost:8000/storage/${product.image}`}
              alt={product.name}
              style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
            />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <button>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
