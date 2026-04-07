import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css'; // Updated to point to your new Register CSS

const RegisterPage = () => { 
  const navigate = useNavigate(); 
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Ensure your backend is running on port 5000
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Kayıt Başarılı! Lütfen giriş yapın.");
        navigate('/login'); 
      } else {
        alert("Kayıt Başarısız: " + data.message);
      }

    } catch (error) {
      console.error("Backend bağlantı hatası:", error);
      alert("Sunucuya ulaşılamadı. Lütfen backend'in çalıştığından emin olun.");
    }
  };

  return (
    <main className="login-container">
      <section className="login-image-section">
        <div className="brand-overlay">
          <h1>Saatinden</h1>
          <p>Join the premier marketplace for horology enthusiasts.</p>
        </div>
      </section>

      <section className="login-form-section">
        <div className="form-wrapper">
          <header className="form-header">
            <h2>Create an Account</h2>
            <p className="subtitle">
              Start building your collection and connecting with sellers today.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              {/* Note: 'name' must match the key in your formData state */}
              <input 
                type="text" 
                id="fullName" 
                name="fullName" 
                placeholder="John Doe" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="name@example.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="input-group">
              <div className="label-flex">
                <label htmlFor="password">Password</label>
              </div>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Create a strong password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              Sign Up
            </button>
          </form>

          <div className="divider">
            <span>Already have an account?</span>
          </div>

          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/login')}
          >
            Sign In Instead
          </button>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;