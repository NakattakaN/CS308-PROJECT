import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için eklendi
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate(); // Yönlendirme fonksiyonunu tanımladık

  // Form verilerini tuttuğumuz state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Input alanları değiştikçe state'i güncelleyen fonksiyon
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Form gönderildiğinde (Sign In butonuna basıldığında) çalışacak fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Backend'e form verilerini gönderiyoruz (POST isteği)
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

      // Backend'den gelen cevabı (JSON) okuyoruz
      const data = await response.json();

      if (data.success) {
        alert("Giriş Başarılı! Hoş geldin.");
        
        // BAŞARILI GİRİŞTEN SONRA ANA SAYFAYA (ProductPage) YÖNLENDİR
        navigate('/home'); 
      } else {
        // Hatalı şifre veya kullanıcı bulunamadı durumu
        alert("Giriş Başarısız: " + data.message);
      }

    } catch (error) {
      console.error("Backend bağlantı hatası:", error);
      alert("Sunucuya ulaşılamadı. Lütfen backend'in (Node.js) çalıştığından emin olun.");
    }
  };

  return (
    <main className="login-container">
      {/* Sol Taraf: Görsel Alanı */}
      <section className="login-image-section">
        <div className="brand-overlay">
          <h1>Saatinden</h1>
          <p>The marketplace for horology enthusiasts.</p>
        </div>
      </section>

      {/* Sağ Taraf: Form Alanı */}
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

          {/* KAYIT SAYFASINA YÖNLENDİREN BUTON */}
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