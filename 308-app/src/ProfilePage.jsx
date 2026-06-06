import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import './ProfilePage.css';

const ProfilePage = () => {
  const showToast = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    taxId: '',
    homeAddress: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch('http://localhost:5000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          taxId: data.taxId || '',
          homeAddress: data.homeAddress || ''
        });
      } else {
        showToast('Failed to load profile', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          taxId: formData.taxId,
          homeAddress: formData.homeAddress
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated successfully!', 'success');
        // Update local storage in case name changed
        localStorage.setItem('userName', formData.firstName);
        // Force navbar refresh event (simplistic way)
        window.dispatchEvent(new Event('storage'));
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error saving profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading profile...</div>;

  return (
    <div className="profile-page-container">
      <h1>My Profile</h1>
      <p className="profile-subtitle">Manage your personal information and shipping details.</p>
      
      <form className="profile-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="profile-form-group">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="profile-form-group">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
          </div>
        </div>
        
        <div className="profile-form-group">
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" value={formData.email} disabled title="Email cannot be changed" />
        </div>

        <div className="profile-form-group">
          <label htmlFor="taxId">Tax ID (Optional)</label>
          <input type="text" id="taxId" name="taxId" value={formData.taxId} onChange={handleChange} placeholder="e.g. 123456789" />
        </div>

        <div className="profile-form-group">
          <label htmlFor="homeAddress">Default Shipping Address (Optional)</label>
          <textarea 
            id="homeAddress" 
            name="homeAddress" 
            value={formData.homeAddress} 
            onChange={handleChange} 
            rows={3} 
            placeholder="123 Main St, City, Country"
          />
        </div>

        <button type="submit" className="profile-save-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
