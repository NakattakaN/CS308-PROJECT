import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductPage.css';

const ProductPage = () => {
  const navigate = useNavigate();
  const sortMenuRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [products, setProducts] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

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

    const fetchLatestReviews = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/reviews/latest');
        const data = await response.json();
        if (response.ok) {
          setLatestReviews(data);
        }
      } catch (error) {
        console.error('Error fetching latest reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchProducts();
    fetchLatestReviews();
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
    const queryTerms = searchQuery.trim().toLowerCase().split(' ').filter(Boolean);
    const filtered = products.filter((product) => {
      const searchString = `${product.brand} ${product.name} ${product.referenceNumber || ''} ${product.description || ''}`.toLowerCase();
      const matchSearch = queryTerms.length === 0 || queryTerms.every(term => searchString.includes(term));

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
      
      if (sortOption === 'rating-desc' || sortOption === 'rating-asc') {
        const hasA = (a.reviewCount || 0) > 0;
        const hasB = (b.reviewCount || 0) > 0;
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        if (!hasA && !hasB) return 0; // Both have no reviews, keep order
        
        // Both have reviews, sort by rating
        return sortOption === 'rating-desc' 
          ? b.averageRating - a.averageRating 
          : a.averageRating - b.averageRating;
      }

      if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });
  }, [products, filters, sortOption, searchQuery]);

  const sortLabelMap = {
    newest: 'New Arrivals',
    oldest: 'Oldest Arrivals',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    'rating-desc': 'Rating: High to Low',
    'rating-asc': 'Rating: Low to High'
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

      {latestReviews.length > 0 && (
        <section className="latest-reviews-section">
          <h2>What Our Customers Say</h2>
          <div className="reviews-grid">
            {latestReviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <span className="reviewer-name">{review.reviewerName}</span>
                  <div className="product-rating-stars">
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} style={{ color: n <= review.rating ? '#f5a623' : '#d4d4d4' }}>★</span>
                    ))}
                  </div>
                </div>
                <p className="review-body">"{review.body || 'No comment provided.'}"</p>
                {review.product && (
                  <div
                    className="review-product-link"
                    onClick={() => navigate(`/product/${review.product._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={review.product.image}
                      alt={review.product.name}
                      className="review-product-img"
                    />
                    <div className="review-product-info">
                      <span className="review-product-name">{review.product.name}</span>
                      <span className="review-product-brand">{review.product.brand}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="global-categories-bar">
        {[
          { label: 'All Watches', value: '' },
          { label: "Men's", value: 'erkek' },
          { label: "Women's", value: 'kadın' },
          { label: 'Unisex', value: 'unisex' }
        ].map((cat) => (
          <button
            key={cat.label}
            className={`category-pill ${filters.gender === cat.value ? 'active' : ''}`}
            onClick={() => {
              setFilters(prev => ({ ...prev, gender: cat.value }));
              setDraftFilters(prev => ({ ...prev, gender: cat.value }));
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

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
                  className={`sort-option ${sortOption === 'oldest' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('oldest');
                    setIsSortOpen(false);
                  }}
                >
                  Oldest Arrivals
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

                <button
                  className={`sort-option ${sortOption === 'rating-desc' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('rating-desc');
                    setIsSortOpen(false);
                  }}
                >
                  Rating: High to Low
                </button>

                <button
                  className={`sort-option ${sortOption === 'rating-asc' ? 'active' : ''}`}
                  onClick={() => {
                    setSortOption('rating-asc');
                    setIsSortOpen(false);
                  }}
                >
                  Rating: Low to High
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
            <ProductCard key={product._id} product={product} navigate={navigate} />
          ))}
        </section>
      ) : (
        <div className="no-results">
          <h3>No timepieces found</h3>
          <p>Try adjusting your search or filters to find what you're looking for.</p>
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

const ProductCard = ({ product, navigate }) => {
  const [hasError, setHasError] = React.useState(!product.image);

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product._id}`)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <div className={`product-status-badge ${product.status === 'available' ? 'status-available' : 'status-unavailable'}`}>
        {product.status === 'available' ? 'Available' : 'Unavailable'}
      </div>
      {product.status === 'available' && product.stock != null && product.stock <= 10 && product.stock > 0 && (
        <div className="product-low-stock-badge">
          Only {product.stock} left!
        </div>
      )}

      {!hasError ? (
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          onError={handleError}
        />
      ) : (
        <div className="product-image-placeholder">
          <span style={{ fontSize: '3rem' }}>⌚</span>
          <span style={{ fontSize: '1rem', opacity: 0.6, marginTop: '1rem' }}>{product.brand}</span>
        </div>
      )}

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
  );
};

export default ProductPage;