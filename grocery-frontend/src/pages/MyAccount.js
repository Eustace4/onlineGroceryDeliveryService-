import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, 
  FaBox, 
  FaHeart, 
  FaMapMarkerAlt, 
  FaSignOutAlt,
  FaEye, 
  FaEyeSlash, 
  FaCheck, 
  FaTimes
} from 'react-icons/fa';

// Import CSS Modules
import styles from './MyAccount.module.css';

// Import other components
import Avatar from '../components/Avatar';
import AddressSection from '../components/AddressSection';
import Orders from '../components/Orders';
import WishlistSection from '../components/WishlistSection';

/**
 * Password Input Component
 * Using CSS Modules: styles.passwordInputContainer, styles.passwordInput
 */
const PasswordInput = ({ value, onChange, placeholder, show, toggleShow }) => (
  <div className={styles.passwordInputContainer} style={{ position: 'relative' }}>
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      className={styles.passwordInput}
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


const MyAccount = () => {
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

  // Load user profile data
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

  // Event handlers
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  // Password visibility toggles
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

  // Change password handler
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
  
  // Handle profile picture upload
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

  // Remove profile picture
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

  // Loading and error states
  if (loading) return <div className={styles.myaccountContainer}>Loading account...</div>;
  if (!user) return null;

  return (
    <div className={styles.myaccountContainer}>
      {/* Sidebar */}
      <aside className={styles.myaccountSidebar}>
        <div className={styles.sidebarHeader}>
          <Avatar profilePicture={user.profile_picture} name={user.name} />
          <div className={styles.sidebarUserInfo}>
            <h4>{user.name}</h4>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
          >
            <FaUser /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`}
          >
            <FaBox /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('addresses')} 
            className={`${styles.navItem} ${activeTab === 'addresses' ? styles.active : ''}`}
          >
            <FaMapMarkerAlt /> Addresses
          </button>
          <button 
            onClick={() => setActiveTab('wishlist')} 
            className={`${styles.navItem} ${activeTab === 'wishlist' ? styles.active : ''}`}
          >
            <FaHeart /> Wishlist
          </button>
        </nav>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.myaccountContent}>
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarContainer}>
                <Avatar profilePicture={user.profile_picture} name={user.name} />

                <div className={styles.avatarActionWrapper}>
                  {!showAvatarOptions ? (
                    <button
                      className={styles.btnPrimary}
                      onClick={() => setShowAvatarOptions(true)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit Profile Picture
                    </button>
                  ) : (
                    <div className={styles.avatarOptions}>
                      <label htmlFor="upload-avatar" className={styles.btnPrimary} style={{ cursor: 'pointer' }}>
                        Upload New Picture
                      </label>
                      <input
                        type="file"
                        id="upload-avatar"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                      />
                      <button className={styles.btnDanger} onClick={handleRemovePicture}>
                        Remove Picture
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setShowAvatarOptions(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.profileInfo}>
                <h2>My Profile</h2>
                <p className={styles.profileSubtitle}>Manage your account information</p>
              </div>
            </div>

            {/* Personal Information Form */}
            <div className={styles.formSection}>
              <h3>Personal Information</h3>
              <form className={styles.modernForm} onSubmit={handleSaveChanges}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className={styles.emailInput}
                  />
                </div>

                {!isEditing && (
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                )}

                {isEditing && (
                  <>
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
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

            {/* Change Password Section */}
            <div className={styles.formSection}>
              <h3>Change Password</h3>
              <form className={styles.modernForm} onSubmit={handlePasswordChange}>
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    show={showCurrentPassword}
                    toggleShow={toggleCurrentPassword}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    show={showNewPassword}
                    toggleShow={toggleNewPassword}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Confirm New Password</label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    show={showConfirmPassword}
                    toggleShow={toggleConfirmPassword}
                  />
                </div>

                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isPasswordLoading}>
                  {isPasswordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className={`${styles.formSection} ${styles.dangerZone}`}>
              <h3>Danger Zone</h3>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
              <button 
                type="button" 
                onClick={handleDeleteAccount} 
                className={`${styles.btn} ${styles.btnDanger}`} 
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}

        {/* Other Tab Contents */}
        {activeTab === 'addresses' && <AddressSection token={token} />}
        {activeTab === 'orders' && <Orders token={token} />}
        {activeTab === 'wishlist' && <WishlistSection token={token} />}
      </main>
    </div>
  );
};

// ES6 Module Export
export default MyAccount;