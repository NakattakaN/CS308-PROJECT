import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './RegisterPage.css';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_HINT = '8+ characters, at least 1 letter and 1 number.';

const RegisterPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    taxId: '',
    homeAddress: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'password') {
      setPasswordError(value && !PASSWORD_REGEX.test(value) ? PASSWORD_HINT : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!PASSWORD_REGEX.test(formData.password)) {
      setPasswordError(PASSWORD_HINT);
      return;
    }

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
        showToast('Registration Successful! Please login.', 'success');
        navigate('/login');
      } else {
        showToast('Registration Failed: ' + data.message, 'error');
      }

    } catch (error) {
      console.error("Backend connection error:", error);
      showToast('Server unreachable. Please make sure the backend is running.', 'error');
    }
  };

  return (
    <div className="login-page-wrapper">
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
                <label htmlFor="taxId">Tax ID (Optional)</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  placeholder="e.g. 123456789"
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="homeAddress">Home Address (Optional)</label>
                <textarea
                  id="homeAddress"
                  name="homeAddress"
                  placeholder="123 Main St, City, Country"
                  value={formData.homeAddress}
                  onChange={handleChange}
                  rows={2}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div className="input-group">
                <div className="label-flex">
                  <label htmlFor="password">Password</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      padding: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'color 0.2s'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onMouseEnter={(e) => e.target.style.color = 'var(--primary-color)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <small style={{ color: passwordError ? '#b00020' : '#777', display: 'block', marginTop: '4px' }}>
                  {passwordError || PASSWORD_HINT}
                </small>
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
    </div>
  );
};

export default RegisterPage;