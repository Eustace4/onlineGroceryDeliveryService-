import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaBox, FaHeart, FaMapMarkerAlt, FaSignOutAlt,
  FaEye, FaEyeSlash, FaCheck, FaTimes
} from 'react-icons/fa';
//import './MyAccount.css';
import Avatar from '../components/Avatar'; // adjust the path as needed
import AddressSection from '../components/AddressSection';
import Orders from '../components/Orders';


// Move PasswordInput outside the main component to prevent re-renders
const PasswordInput = ({ value, onChange, placeholder, show, toggleShow }) => (
  <div className="password-input-container" style={{ position: 'relative' }}>
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      className="password-input"
    />
    <span
      onClick={toggleShow}
      style={{
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleShow();
        }
      }}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <FaEyeSlash /> : <FaEye />}
    </span>
  </div>
);

export default function MyAccount() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);


  const userIdRef = useRef(null);

  const token = localStorage.getItem('auth_token');
  const authUser = JSON.parse(localStorage.getItem('auth_user'));

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('http://localhost:8000/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then(async (res) => {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        const data = await res.json();
        const userData = data.user;
        setUser(userData);
        setEditName(userData.name || '');
        setEditPhone(userData.phone || '');
        userIdRef.current = userData.id;
      })
      .catch((err) => {
        setError(err.message);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  // Use useCallback to prevent unnecessary re-renders
  const toggleCurrentPassword = useCallback(() => {
    setShowCurrentPassword(prev => !prev);
  }, []);

  const toggleNewPassword = useCallback(() => {
    setShowNewPassword(prev => !prev);
  }, []);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Save profile changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (!userIdRef.current) {
      alert("User not loaded yet");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/users/${userIdRef.current}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Change password handler with separate loading state
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!userIdRef.current) {
      alert("User not loaded yet");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    if (!token) {
      alert('Session expired. Please log in again.');
      navigate('/login');
      return;
    }

    setIsPasswordLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/users/${userIdRef.current}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(result.message || 'Failed to change password');
      }
    } catch (err) {
      alert('Error changing password.');
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const res = await fetch('http://localhost:8000/api/profile/upload-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, profile_picture: data.profile_picture_url }));
        alert('Profile picture updated!');
        setShowAvatarOptions(false);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      alert('Error uploading');
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm('Are you sure you want to remove your picture?')) return;

    try {
      const res = await fetch('http://localhost:8000/api/profile/remove-picture', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setUser(prev => ({ ...prev, profile_picture: null }));
        alert('Picture removed');
        setShowAvatarOptions(false);
      } else {
        alert('Failed to remove');
      }
    } catch (err) {
      alert('Error removing picture');
    }
  };


  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;

    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/users/${authUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Account deleted successfully');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        navigate('/');
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to delete account');
      }
    } catch (err) {
      alert('Error deleting account.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="myaccount-container">Loading account...</div>;
  if (!user) return null;

  return (
    <div className="myaccount-container">
      <aside className="myaccount-sidebar">
        <div className="sidebar-header">
          <Avatar profilePicture={user.profile_picture} name={user.name} />
          <div className="sidebar-user-info">
            <h4>{user.name}</h4>
            <span className="user-email">{user.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('profile')} className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}>
            <FaUser /> Profile
          </button>
          <button onClick={() => setActiveTab('orders')} className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
            <FaBox /> Orders
          </button>
          <button onClick={() => setActiveTab('addresses')} className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`}>
            <FaMapMarkerAlt /> Addresses
          </button>
          <button onClick={() => setActiveTab('wishlist')} className={`nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}>
            <FaHeart /> Wishlist
          </button>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      <main className="myaccount-content">
        {activeTab === 'profile' && (
          <>
        <div className="tab-content">
          <div className="profile-header">
            <div className="avatar-container">
              <Avatar profilePicture={user.profile_picture} name={user.name} />

              <div className="avatar-action-wrapper">
                {!showAvatarOptions ? (
                  <button
                    className="btn-primary"
                    onClick={() => setShowAvatarOptions(true)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    Edit Profile Picture
                  </button>
                ) : (
                  <div className="avatar-options">
                    <label htmlFor="upload-avatar" className="btn-primary" style={{ cursor: 'pointer' }}>
                      Upload New Picture
                    </label>
                    <input
                      type="file"
                      id="upload-avatar"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleUpload}
                    />
                    <button className="btn-danger" onClick={handleRemovePicture}>
                      Remove Picture
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => setShowAvatarOptions(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-info">
              <h2>My Profile</h2>
              <p className="profile-subtitle">Manage your account information</p>
            </div>
          </div>

          <div className="form-section">
            <h3>Personal Information</h3>
            <form className="modern-form" onSubmit={handleSaveChanges}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="email-input"
                />
                {/*<span className={`verification-badge ${user.email_verified ? 'verified' : 'unverified'}`}>
                  {user.email_verified ? (
                    <><FaCheck /> Verified</>
                  ) : (
                    <><FaTimes /> Not Verified</>
                  )}
                </span>
                {!user.email_verified && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => alert('Verification email sent')}
                    style={{ marginTop: '10px' }}
                  >
                    Send Verification Email
                  </button>
                )}*/}
              </div>


              {!isEditing && (
                <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}

              {isEditing && (
                <>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setEditName(user.name || '');
                      setEditPhone(user.phone || '');
                      setIsEditing(false);
                    }}
                    disabled={isLoading}
                    style={{ marginLeft: '10px' }}
                  >
                    Cancel
                  </button>
                </>
              )}
              {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </form>
          </div>

          <div className="form-section">
            <h3>Change Password</h3>
            <form className="modern-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  show={showCurrentPassword}
                  toggleShow={toggleCurrentPassword}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  show={showNewPassword}
                  toggleShow={toggleNewPassword}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  show={showConfirmPassword}
                  toggleShow={toggleConfirmPassword}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={isPasswordLoading}>
                {isPasswordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          <div className="form-section danger-zone">
            <h3>Danger Zone</h3>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
            <button 
              type="button" 
              onClick={handleDeleteAccount} 
              className="btn btn-danger" 
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
          

        </div>
        </> 
      )}
      {activeTab === 'addresses' && <AddressSection token={token} />}
      {/* Placeholder for other tabs if needed */}
      {activeTab === 'orders' && <Orders token={token} />}
      {activeTab === 'wishlist' && <p>Wishlist section coming soon...</p>}
    </main>
    </div>
  );
}