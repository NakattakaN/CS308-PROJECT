import React, { useState } from 'react';
import './LoginPage.css'; // Reusing your existing CSS for layout consistency

const RegisterPage = ({ navigateTo }) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration attempt:', formData);
  };

  return (
    <main className="login-container">
      {/* Left Side: Image Showcase */}
      <section className="login-image-section">
        <div className="brand-overlay">
          <h1>Saatinden</h1>
          <p>Join the premier marketplace for horology enthusiasts.</p>
        </div>
      </section>

      {/* Right Side: Form Layout */}
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
            onClick={() => navigateTo('login')}
          >
            Sign in instead
          </button>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;