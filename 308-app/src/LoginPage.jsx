import React, { useState } from 'react';
import './LoginPage.css';

const LoginPage = () => {
  // Consolidating form state into a single object for cleaner management
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
  };

  return (
    <main className="login-container">
      {/* Left Side: Image Showcase */}
      <section className="login-image-section">
        <div className="brand-overlay">
          <h1>Saatinden</h1>
          <p>The marketplace for horology enthusiasts.</p>
        </div>
      </section>

      {/* Right Side: Form Layout */}
      <section className="login-form-section">
        <div className="form-wrapper">
          <header className="form-header">
            <h2>Welcome Back</h2>
            <p className="subtitle">
              Sign in to your account to track orders and manage your collection.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
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
                <a href="#forgot" className="forgot-password">Forgot Password?</a>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe">Keep me signed in</label>
            </div>

            <button type="submit" className="btn-primary">Sign In</button>
          </form>

          <div className="divider">
            <span>New to Saatinden?</span>
          </div>

          <button type="button" className="btn-secondary">
            Create your account
          </button>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;