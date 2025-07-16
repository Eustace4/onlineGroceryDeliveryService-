// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModernAuthStyles.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 loading state

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');

    if (!token || !userData) {
      navigate('/');
    } else {
      setUser(JSON.parse(userData));
      setTimeout(() => {
        setLoading(false); // 👈 simulate delay for loading animation
      }, 1000);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="logo">🛒 FreshMart</div>
        <div className="tagline">Welcome to your dashboard</div>
      </div>

      <div className="auth-body">
        {user && (
          <>
            <h2>Hello, {user.name}!</h2>
            <p>Role: {user.role}</p>
            <button className="auth-button" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
}
