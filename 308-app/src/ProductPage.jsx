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

  const [searchQuery, setSearchQuery] = useState('');
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
          console.error('Error fetching watches:', data.message || data.error);
        }
      } catch (error) {
        console.error('Error fetching watches:', error);
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
    localStorage.removeItem('authToken');
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
    const query = searchQuery.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchSearch = !query ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query);
      const matchGender = !filters.gender || product.gender === filters.gender;
      const matchStrapColor = !filters.strapColor || product.strapColor === filters.strapColor;
      const matchStrapMaterial =
        !filters.strapMaterial || product.strapMaterial === filters.strapMaterial;
      const matchCaseShape = !filters.caseShape || product.caseShape === filters.caseShape;
      const matchDisplayType =
        !filters.displayType || product.displayType === filters.displayType;

      return (
        matchSearch &&
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
    newest: 'New Arrivals',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low'
  };

  if (loading) {
    return (
      <div className="product-page-container">
        <div className="loading-state">Loading timepieces...</div>
      </div>
    );
  }

  return (
    <div className="product-page-container">

      <section className="hero-section">
        <h1>Discover Exceptional Timepieces</h1>
        <p>
          Explore our curated marketplace and find the perfect watch for your collection.
        </p>
        <div className="search-bar-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </section>

      <section className="top-controls">
        <div className="main-actions">
          <button className="main-control-btn" onClick={openFilterModal}>
            Filters
          </button>

          <div className="sort-wrapper" ref={sortMenuRef}>
            <button
              className="main-control-btn"
              onClick={() => setIsSortOpen((prev) => !prev)}
            >
              Sort By
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
                  New Arrivals
                </button>

                <button
                  className={`sort-option ${sortOption === 'price-asc' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('price-asc');
                    setIsSortOpen(false);
                  }}
                >
                  Price: Low to High
                </button>

                <button
                  className={`sort-option ${sortOption === 'price-desc' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('price-desc');
                    setIsSortOpen(false);
                  }}
                >
                  Price: High to Low
                </button>
              </div>
            )}
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        <div className="selection-summary">
          <span>Selected sort: {sortLabelMap[sortOption]}</span>
        </div>
      </section>

      <div className="results-info">
        <p>Showing {filteredProducts.length} items</p>
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
              <img
                src={product.image}
                alt={product.name}
                className="product-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  const placeholder = document.createElement('div');
                  placeholder.className = 'product-image-placeholder';
                  placeholder.innerHTML = `<span style="font-size:3rem">⌚</span><span style="font-size:1rem;opacity:0.6;margin-top:5rem">${product.brand}</span>`;
                  e.target.parentNode.insertBefore(placeholder, e.target);
                }}
              />

              <div className="product-info">
                <p className="product-brand">{product.brand}</p>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${product.price.toLocaleString()}</p>
                {product.reviewCount > 0 && (
                  <div className="product-rating">
                    <span className="product-rating-stars">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} style={{ color: n <= Math.round(product.averageRating) ? '#f5a623' : '#d4d4d4' }}>★</span>
                      ))}
                    </span>
                    <span className="product-rating-text">
                      {product.averageRating.toFixed(1)} ({product.reviewCount})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="empty-results">
          <p>No products found matching these filters.</p>
        </div>
      )}

      {isFilterModalOpen && (
        <div className="filter-modal-overlay" onClick={closeFilterModal}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h2>Filters</h2>
              <button className="filter-close-btn" onClick={closeFilterModal}>
                ×
              </button>
            </div>

            <div className="filter-groups">
              <div className="filter-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={draftFilters.gender}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">All</option>
                  <option value="kadın">Women</option>
                  <option value="erkek">Men</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Strap color</label>
                <select
                  name="strapColor"
                  value={draftFilters.strapColor}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">All</option>
                  <option value="gümüş">Silver</option>
                  <option value="altın">Gold</option>
                  <option value="mavi">Blue</option>
                  <option value="yeşil">Green</option>
                  <option value="sarı">Yellow</option>
                  <option value="kırmızı">Red</option>
                  <option value="turuncu">Orange</option>
                  <option value="mor">Purple</option>
                  <option value="kahverengi">Brown</option>
                  <option value="pembe">Pink</option>
                  <option value="siyah">Black</option>
                  <option value="beyaz">White</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Strap material</label>
                <select
                  name="strapMaterial"
                  value={draftFilters.strapMaterial}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">All</option>
                  <option value="metal">Metal</option>
                  <option value="deri">Leather</option>
                  <option value="silikon">Silicon</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Case shape</label>
                <select
                  name="caseShape"
                  value={draftFilters.caseShape}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">All</option>
                  <option value="oval">Oval</option>
                  <option value="köşeli">Square</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Display type</label>
                <select
                  name="displayType"
                  value={draftFilters.displayType}
                  onChange={handleDraftFilterChange}
                >
                  <option value="">All</option>
                  <option value="analog">Analog</option>
                  <option value="dijital">Digital</option>
                </select>
              </div>
            </div>

            <div className="filter-modal-actions">
              <button className="apply-btn" onClick={applyFilters}>
                Apply
              </button>
              <button className="modal-clear-btn" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;