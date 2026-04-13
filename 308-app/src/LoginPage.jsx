import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate(); // Defined the navigation function

  // State to hold form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Function to update state as input fields change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Function to run when the form is submitted (Sign In button clicked)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Sending form data to backend (POST request)
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      // Reading response from backend (JSON)
      const data = await response.json();

      if (data.success) {
        alert("Login Successful! Welcome.");
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.firstName);
        localStorage.setItem('authToken', data.token);
        // REDIRECT TO HOME PAGE (ProductPage) AFTER SUCCESSFUL LOGIN
        navigate('/home');
      } else {
        // Incorrect password or user not found case
        alert("Login Failed: " + data.message);
      }

    } catch (error) {
      console.error("Backend connection error:", error);
      alert("Server unreachable. Please make sure the backend (Node.js) is running.");
    }
  };

  return (
    <main className="login-container">
      {/* Left Side: Image Area */}
      <section className="login-image-section">
        <div className="brand-overlay">
          <h1>Saatinden</h1>
          <p>The marketplace for horology enthusiasts.</p>
        </div>
      </section>

      {/* Right Side: Form Area */}
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

          {/* BUTTON REDIRECTING TO REGISTRATION PAGE */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/register')}
          >
            Create your account
          </button>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;