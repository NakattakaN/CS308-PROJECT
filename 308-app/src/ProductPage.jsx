import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ProductPage.css';

const FILTER_CONFIG = [
  {
    key: 'strapColor',
    label: 'Strap Color',
    options: [
      { value: 'gümüş', label: 'Silver' }, { value: 'altın', label: 'Gold' },
      { value: 'mavi', label: 'Blue' }, { value: 'yeşil', label: 'Green' },
      { value: 'sarı', label: 'Yellow' }, { value: 'kırmızı', label: 'Red' },
      { value: 'turuncu', label: 'Orange' }, { value: 'mor', label: 'Purple' },
      { value: 'kahverengi', label: 'Brown' }, { value: 'pembe', label: 'Pink' },
      { value: 'siyah', label: 'Black' }, { value: 'beyaz', label: 'White' },
    ]
  },
  {
    key: 'strapMaterial',
    label: 'Strap Material',
    options: [
      { value: 'metal', label: 'Metal' }, { value: 'deri', label: 'Leather' },
      { value: 'silikon', label: 'Silicon' }, { value: 'kumaş', label: 'Fabric' },
    ]
  },
  {
    key: 'caseShape',
    label: 'Case Shape',
    options: [
      { value: 'oval', label: 'Oval' }, { value: 'köşeli', label: 'Square' },
    ]
  },
  {
    key: 'displayType',
    label: 'Display Type',
    options: [
      { value: 'analog', label: 'Analog' }, { value: 'dijital', label: 'Digital' },
    ]
  },
  {
    key: 'dialColor',
    label: 'Dial Color',
    options: [
      { value: 'gümüş', label: 'Silver' }, { value: 'altın', label: 'Gold' },
      { value: 'mavi', label: 'Blue' }, { value: 'yeşil', label: 'Green' },
      { value: 'sarı', label: 'Yellow' }, { value: 'kırmızı', label: 'Red' },
      { value: 'turuncu', label: 'Orange' }, { value: 'mor', label: 'Purple' },
      { value: 'kahverengi', label: 'Brown' }, { value: 'pembe', label: 'Pink' },
      { value: 'siyah', label: 'Black' }, { value: 'beyaz', label: 'White' },
      { value: 'krem', label: 'Cream' },
    ]
  },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'New Arrivals' },
  { value: 'oldest', label: 'Oldest Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Rating: High to Low' },
  { value: 'rating-asc', label: 'Rating: Low to High' },
];

const Chevron = () => (
  <svg className="filter-bar-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ProductPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const filterBarRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    gender: '', strapColor: [], strapMaterial: [], caseShape: [], displayType: [], dialColor: []
  });
  const [sortOption, setSortOption] = useState('newest');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        if (response.ok) setProducts(data);
        else console.error('Error fetching watches:', data.message || data.error);
      } catch (error) {
        console.error('Error fetching watches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearFilters = () => {
    setFilters(prev => ({
      gender: prev.gender, strapColor: [], strapMaterial: [], caseShape: [], displayType: [], dialColor: []
    }));
    setActiveDropdown(null);
  };

  const toggleDropdown = (key) => setActiveDropdown(prev => prev === key ? null : key);

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const clearFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: [] }));
  };

  const filteredProducts = useMemo(() => {
    const queryTerms = searchQuery.trim().toLowerCase().split(' ').filter(Boolean);
    const filtered = products.filter((product) => {
      const searchString = `${product.brand} ${product.name} ${product.referenceNumber || ''} ${product.description || ''}`.toLowerCase();
      const matchSearch = queryTerms.length === 0 || queryTerms.every(term => searchString.includes(term));
      const matchGender = !filters.gender || product.gender === filters.gender;
      const matchStrapColor = filters.strapColor.length === 0 || filters.strapColor.includes(product.strapColor);
      const matchStrapMaterial = filters.strapMaterial.length === 0 || filters.strapMaterial.includes(product.strapMaterial);
      const matchCaseShape = filters.caseShape.length === 0 || filters.caseShape.includes(product.caseShape);
      const matchDisplayType = filters.displayType.length === 0 || filters.displayType.includes(product.displayType);
      const matchDialColor = filters.dialColor.length === 0 || filters.dialColor.includes(product.dialColor);
      return matchSearch && matchGender && matchStrapColor && matchStrapMaterial && matchCaseShape && matchDisplayType && matchDialColor;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'rating-desc' || sortOption === 'rating-asc') {
        const hasA = (a.reviewCount || 0) > 0;
        const hasB = (b.reviewCount || 0) > 0;
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        if (!hasA && !hasB) return 0;
        return sortOption === 'rating-desc' ? b.averageRating - a.averageRating : a.averageRating - b.averageRating;
      }
      if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });
  }, [products, filters, sortOption, searchQuery]);

  const availableValues = useMemo(() => {
    const result = {};
    for (const { key } of FILTER_CONFIG) {
      const candidates = products.filter(product => {
        const matchGender = !filters.gender || product.gender === filters.gender;
        const otherFiltersMatch = FILTER_CONFIG.filter(f => f.key !== key).every(({ key: otherKey }) =>
          filters[otherKey].length === 0 || filters[otherKey].includes(product[otherKey])
        );
        return matchGender && otherFiltersMatch;
      });
      result[key] = new Set(candidates.map(p => p[key]).filter(v => v != null));
    }
    return result;
  }, [products, filters]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort';

  if (loading) {
    return (
      <div className="product-page-container">
        <div className="loading-state">Loading timepieces...</div>
      </div>
    );
  }

  return (
    <>
      <div className="filter-bar" ref={filterBarRef}>
        <button className="filter-bar-categories" onClick={() => setIsSideMenuOpen(true)}>
          <span className="filter-bar-hamburger"><span /><span /><span /></span>
          Categories
        </button>

        <div className="filter-bar-divider" />

        {FILTER_CONFIG.map(({ key, label, options }) => {
          const selected = filters[key];
          const isOpen = activeDropdown === key;
          return (
            <div key={key} className="filter-bar-item">
              <button
                className={`filter-bar-btn ${isOpen ? 'open' : ''} ${selected.length > 0 ? 'selected' : ''}`}
                onClick={() => toggleDropdown(key)}
              >
                {label}
                {selected.length > 0 && <span className="filter-bar-count">{selected.length}</span>}
                <Chevron />
              </button>
              {isOpen && (
                <div className="filter-bar-dropdown">
                  {options.filter(opt => availableValues[key]?.has(opt.value)).map(opt => {
                    const checked = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        className={`filter-bar-dropdown-item ${checked ? 'active' : ''}`}
                        onClick={() => toggleFilter(key, opt.value)}
                      >
                        <span className="filter-check">{checked ? '✓' : ''}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                  {selected.length > 0 && (
                    <button className="filter-bar-dropdown-clear" onClick={() => clearFilter(key)}>
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button className="filter-bar-clear" onClick={clearFilters}>
          Clear filters
        </button>

        <div className="filter-bar-spacer" />

        <div className="filter-bar-divider" />

        <div className="filter-bar-item">
          <button
            className={`filter-bar-btn ${activeDropdown === 'sort' ? 'open' : ''}`}
            onClick={() => toggleDropdown('sort')}
          >
            {currentSortLabel}
            <Chevron />
          </button>
          {activeDropdown === 'sort' && (
            <div className="filter-bar-dropdown filter-bar-dropdown-right">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-bar-dropdown-item ${sortOption === opt.value ? 'active' : ''}`}
                  onClick={() => { setSortOption(opt.value); setActiveDropdown(null); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="product-page-container">
        <section className="hero-section">
          <h1>Discover Exceptional Timepieces</h1>
          <p>Explore our curated marketplace and find the perfect watch for your collection.</p>
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
      </div>

      {isSideMenuOpen && (
        <div className="side-menu-overlay" onClick={() => setIsSideMenuOpen(false)}>
          <div className="side-menu" onClick={e => e.stopPropagation()}>
            <div className="side-menu-header">
              <span>Categories</span>
              <button className="side-menu-close" onClick={() => setIsSideMenuOpen(false)}>×</button>
            </div>
            {[
              { label: 'All Watches', value: '' },
              { label: "Men's", value: 'erkek' },
              { label: "Women's", value: 'kadın' },
              { label: 'Unisex', value: 'unisex' }
            ].map(cat => (
              <button
                key={cat.label}
                className={`side-menu-item ${filters.gender === cat.value ? 'active' : ''}`}
                onClick={() => {
                  setFilters(prev => ({ ...prev, gender: cat.value }));
                  setIsSideMenuOpen(false);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const ProductCard = ({ product, navigate }) => {
  const [hasError, setHasError] = React.useState(!product.image);

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product._id}`)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {!hasError ? (
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          onError={() => setHasError(true)}
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
        {product.stock === 0 && (
          <p className="product-out-of-stock">Out of stock</p>
        )}
        {product.stock > 0 && product.stock <= 10 && (
          <p className="product-low-stock">Only {product.stock} left in stock!</p>
        )}
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
