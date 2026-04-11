import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductPage.css';

const ProductPage = () => {
  const navigate = useNavigate();
  const sortMenuRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    gender: '',
    strapColor: '',
    strapMaterial: '',
    caseShape: '',
    displayType: ''
  });

  const [draftFilters, setDraftFilters] = useState({
    gender: '',
    strapColor: '',
    strapMaterial: '',
    caseShape: '',
    displayType: ''
  });

  const [sortOption, setSortOption] = useState('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const userStatus = localStorage.getItem('isLoggedIn');
    const storedName = localStorage.getItem('userName');

    if (userStatus === 'true') {
      setIsLoggedIn(true);
      if (storedName) setUserName(storedName);
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();

        if (response.ok) {
          setProducts(data);
        } else {
          console.error('Saatler çekilirken hata oluştu:', data.message || data.error);
        }
      } catch (error) {
        console.error('Saatler çekilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserName('');
    navigate('/home');
  };

  const openFilterModal = () => {
    setDraftFilters(filters);
    setIsFilterModalOpen(true);
  };

  const closeFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleDraftFilterChange = (e) => {
    const { name, value } = e.target;
    setDraftFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      gender: '',
      strapColor: '',
      strapMaterial: '',
      caseShape: '',
      displayType: ''
    };
    setFilters(emptyFilters);
    setDraftFilters(emptyFilters);
  };

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchGender = !filters.gender || product.gender === filters.gender;
      const matchStrapColor = !filters.strapColor || product.strapColor === filters.strapColor;
      const matchStrapMaterial =
        !filters.strapMaterial || product.strapMaterial === filters.strapMaterial;
      const matchCaseShape = !filters.caseShape || product.caseShape === filters.caseShape;
      const matchDisplayType =
        !filters.displayType || product.displayType === filters.displayType;

      return (
        matchGender &&
        matchStrapColor &&
        matchStrapMaterial &&
        matchCaseShape &&
        matchDisplayType
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
  }, [products, filters, sortOption]);

  const sortLabelMap = {
    newest: 'Yeni Gelenler',
    'price-asc': 'Artan Fiyat',
    'price-desc': 'Azalan Fiyat'
  };

  if (loading) {
    return (
      <div className="product-page-container">
        <div className="loading-state">Saatler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="product-page-container">
      <nav className="navbar">
        <div className="brand-logo">
          <h2>Saatinden</h2>
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <span
                style={{
                  marginRight: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-muted)'
                }}
              >
                Hoş Geldin, {userName}
              </span>

              <button onClick={() => navigate('/cart')} className="nav-link">
                Sepetim
              </button>

              <button
                onClick={handleLogout}
                className="nav-btn-primary"
                style={{ backgroundColor: '#dc2626' }}
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="nav-link">
                Log In
              </button>

              <button onClick={() => navigate('/register')} className="nav-btn-primary">
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="hero-section">
        <h1>Discover Exceptional Timepieces</h1>
        <p>
          Explore our curated marketplace and find the perfect watch for your collection.
        </p>
      </section>

      <section className="top-controls">
        <div className="main-actions">
          <button className="main-control-btn" onClick={openFilterModal}>
            Filtreler
          </button>

          <div className="sort-wrapper" ref={sortMenuRef}>
            <button
              className="main-control-btn"
              onClick={() => setIsSortOpen((prev) => !prev)}
            >
              Sıralama
            </button>

            {isSortOpen && (
              <div className="sort-dropdown">
                <button
                  className={`sort-option ${sortOption === 'newest' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('newest');
                    setIsSortOpen(false);
                  }}
                >
                  Yeni Gelenler
                </button>

                <button
                  className={`sort-option ${sortOption === 'price-asc' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('price-asc');
                    setIsSortOpen(false);
                  }}
                >
                  Artan Fiyat
                </button>

                <button
                  className={`sort-option ${sortOption === 'price-desc' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('price-desc');
                    setIsSortOpen(false);
                  }}
                >
                  Azalan Fiyat
                </button>
              </div>
            )}
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Filtreleri temizle
          </button>
        </div>

        <div className="selection-summary">
          <span>Seçili sıralama: {sortLabelMap[sortOption]}</span>
        </div>
      </section>

      <div className="results-info">
        <p>{filteredProducts.length} ürün gösteriliyor</p>
      </div>

      {filteredProducts.length > 0 ? (
        <section className="product-grid">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="product-card"
              onClick={() => navigate(`/product/${product._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img src={product.image} alt={product.name} className="product-image" />

              <div className="product-info">
                <p className="product-brand">{product.brand}</p>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${product.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="empty-results">
          <p>Bu filtrelere uygun ürün bulunamadı.</p>
        </div>
      )}

      {isFilterModalOpen && (
        <div className="filter-modal-overlay" onClick={closeFilterModal}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h2>Filtreler</h2>
              <button className="filter-close-btn" onClick={closeFilterModal}>
                ×
              </button>
            </div>

            <div className="filter-groups">
              <div className="filter-group">
                <label>Cinsiyet</label>
                <select
                  name="gender"
                  value={draftFilters.gender}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">Tümü</option>
                  <option value="kadın">Kadın</option>
                  <option value="erkek">Erkek</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Kordon rengi</label>
                <select
                  name="strapColor"
                  value={draftFilters.strapColor}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">Tümü</option>
                  <option value="gümüş">Gümüş</option>
                  <option value="altın">Altın</option>
                  <option value="mavi">Mavi</option>
                  <option value="yeşil">Yeşil</option>
                  <option value="sarı">Sarı</option>
                  <option value="kırmızı">Kırmızı</option>
                  <option value="turuncu">Turuncu</option>
                  <option value="mor">Mor</option>
                  <option value="kahverengi">Kahverengi</option>
                  <option value="pembe">Pembe</option>
                  <option value="siyah">Siyah</option>
                  <option value="beyaz">Beyaz</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Kordon materyali</label>
                <select
                  name="strapMaterial"
                  value={draftFilters.strapMaterial}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">Tümü</option>
                  <option value="metal">Metal</option>
                  <option value="deri">Deri</option>
                  <option value="silikon">Silikon</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Kasa şekli</label>
                <select
                  name="caseShape"
                  value={draftFilters.caseShape}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">Tümü</option>
                  <option value="oval">Oval</option>
                  <option value="köşeli">Köşeli</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Gösterim tipi</label>
                <select
                  name="displayType"
                  value={draftFilters.displayType}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">Tümü</option>
                  <option value="analog">Analog</option>
                  <option value="dijital">Dijital</option>
                </select>
              </div>
            </div>

            <div className="filter-modal-actions">
              <button className="apply-btn" onClick={applyFilters}>
                Uygula
              </button>
              <button className="modal-clear-btn" onClick={clearFilters}>
                Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;