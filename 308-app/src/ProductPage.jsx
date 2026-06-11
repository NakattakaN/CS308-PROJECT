import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ProductPage.css';

const FILTER_CONFIG = [
  {
    key: 'strapColor',
    label: 'Strap Color',
    options: [
      { value: 'silver', label: 'Silver' }, { value: 'gold', label: 'Gold' },
      { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' },
      { value: 'yellow', label: 'Yellow' }, { value: 'red', label: 'Red' },
      { value: 'orange', label: 'Orange' }, { value: 'purple', label: 'Purple' },
      { value: 'brown', label: 'Brown' }, { value: 'pink', label: 'Pink' },
      { value: 'black', label: 'Black' }, { value: 'white', label: 'White' },
    ]
  },
  {
    key: 'strapMaterial',
    label: 'Strap Material',
    options: [
      { value: 'metal', label: 'Metal' }, { value: 'leather', label: 'Leather' },
      { value: 'silicone', label: 'Silicon' }, { value: 'fabric', label: 'Fabric' },
    ]
  },
  {
    key: 'caseShape',
    label: 'Case Shape',
    options: [
      { value: 'oval', label: 'Oval' }, { value: 'square', label: 'Square' },
    ]
  },
  {
    key: 'displayType',
    label: 'Display Type',
    options: [
      { value: 'analog', label: 'Analog' }, { value: 'digital', label: 'Digital' },
    ]
  },
  {
    key: 'dialColor',
    label: 'Dial Color',
    options: [
      { value: 'silver', label: 'Silver' }, { value: 'gold', label: 'Gold' },
      { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' },
      { value: 'yellow', label: 'Yellow' }, { value: 'red', label: 'Red' },
      { value: 'orange', label: 'Orange' }, { value: 'purple', label: 'Purple' },
      { value: 'brown', label: 'Brown' }, { value: 'pink', label: 'Pink' },
      { value: 'black', label: 'Black' }, { value: 'white', label: 'White' },
      { value: 'cream', label: 'Cream' },
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
  { value: 'discount-desc', label: 'Discount: High to Low' },
  { value: 'discount-asc', label: 'Discount: Low to High' },
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
    gender: '', brands: [], strapColor: [], strapMaterial: [], caseShape: [], displayType: [], dialColor: []
  });
  const [sortOption, setSortOption] = useState('newest');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [sideMenuPage, setSideMenuPage] = useState('main');
  const [itemsPerRow, setItemsPerRow] = useState(() => {
    try {
      const v = Number(localStorage.getItem('itemsPerRow'));
      return Number.isInteger(v) && v > 0 ? v : 4;
    } catch { return 4; }
  });

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
    setFilters({
      gender: '', brands: [], strapColor: [], strapMaterial: [], caseShape: [], displayType: [], dialColor: []
    });
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

  const activeFilterTags = useMemo(() => {
    const tags = [];
    if (filters.gender) {
      const genderLabel = filters.gender === 'men' ? "Men's" : filters.gender === 'women' ? "Women's" : "Unisex";
      tags.push({ type: 'gender', value: filters.gender, label: `Category: ${genderLabel}` });
    }
    filters.brands.forEach(brand => {
      tags.push({ type: 'brands', value: brand, label: `Brand: ${brand}` });
    });
    FILTER_CONFIG.forEach(cfg => {
      const values = filters[cfg.key] || [];
      values.forEach(val => {
        const option = cfg.options.find(opt => opt.value === val);
        const label = option ? option.label : val;
        tags.push({ type: cfg.key, value: val, label: `${cfg.label}: ${label}` });
      });
    });
    return tags;
  }, [filters]);

  const removeFilterTag = (tag) => {
    setFilters(prev => {
      if (tag.type === 'gender') {
        return { ...prev, gender: '' };
      } else if (tag.type === 'brands') {
        return { ...prev, brands: prev.brands.filter(b => b !== tag.value) };
      } else {
        return { ...prev, [tag.type]: prev[tag.type].filter(v => v !== tag.value) };
      }
    });
  };

  const filteredProducts = useMemo(() => {
    const queryTerms = searchQuery.trim().toLowerCase().split(' ').filter(Boolean);
    const filtered = products.filter((product) => {
      const searchString = `${product.brand} ${product.name} ${product.referenceNumber || ''} ${product.description || ''}`.toLowerCase();
      const matchSearch = queryTerms.length === 0 || queryTerms.every(term => searchString.includes(term));
      const matchGender = !filters.gender || product.gender === filters.gender;
      const matchBrand = filters.brands.length === 0 || filters.brands.includes(product.brand);
      const matchStrapColor = filters.strapColor.length === 0 || filters.strapColor.includes(product.strapColor);
      const matchStrapMaterial = filters.strapMaterial.length === 0 || filters.strapMaterial.includes(product.strapMaterial);
      const matchCaseShape = filters.caseShape.length === 0 || filters.caseShape.includes(product.caseShape);
      const matchDisplayType = filters.displayType.length === 0 || filters.displayType.includes(product.displayType);
      const matchDialColor = filters.dialColor.length === 0 || filters.dialColor.includes(product.dialColor);
      return matchSearch && matchGender && matchBrand && matchStrapColor && matchStrapMaterial && matchCaseShape && matchDisplayType && matchDialColor;
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
      if (sortOption === 'discount-desc') return (b.discountRate || 0) - (a.discountRate || 0);
      if (sortOption === 'discount-asc') return (a.discountRate || 0) - (b.discountRate || 0);
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
        const matchBrands = filters.brands.length === 0 || filters.brands.includes(product.brand);
        const otherFiltersMatch = FILTER_CONFIG.filter(f => f.key !== key).every(({ key: otherKey }) =>
          filters[otherKey].length === 0 || filters[otherKey].includes(product[otherKey])
        );
        return matchGender && matchBrands && otherFiltersMatch;
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
      <div className="product-page-container">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Mastering Time</h1>
            <p>Discover the pinnacle of horological excellence. Explore our curated selection of world-class luxury timepieces.</p>
            <button className="hero-cta" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>Shop Collection</button>
          </div>
          <div className="hero-image-wrapper">
            <img src="/luxury_watch_hero.png" alt="Luxury Watch" className="hero-watch-image" />
          </div>
        </section>

        <section className="bento-categories">
          <div className="bento-box bento-large" onClick={() => { setFilters(prev => ({ ...prev, gender: 'men', brands: [] })); setIsSideMenuOpen(false); }}>
            <div className="bento-overlay bento-mens"></div>
            <h3>Men's Collection</h3>
          </div>
          <div className="bento-box" onClick={() => { setFilters(prev => ({ ...prev, gender: 'women', brands: [] })); setIsSideMenuOpen(false); }}>
            <div className="bento-overlay bento-womens"></div>
            <h3>Women's</h3>
          </div>
          <div className="bento-box" onClick={() => { setFilters(prev => ({ ...prev, brands: ['Rolex'], gender: '' })); setIsSideMenuOpen(false); }}>
            <div className="bento-overlay bento-rolex"></div>
            <h3>Rolex Selection</h3>
          </div>
        </section>

        <div className="results-info">
          <p>Showing {filteredProducts.length} items</p>
        </div>

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

          <div className="filter-bar-spacer" />

          {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : Boolean(v)) && (
            <button className="clear-all-red-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}

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

          <div className="filter-bar-divider" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>Per row:</span>
            <input
              type="number"
              min="1"
              max="8"
              value={itemsPerRow}
              onChange={e => {
                const v = Math.max(1, Math.min(8, Math.floor(Number(e.target.value) || 1)));
                setItemsPerRow(v);
                try { localStorage.setItem('itemsPerRow', String(v)); } catch {}
              }}
              style={{ width: '48px', padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
            />
          </div>
        </div>

        {activeFilterTags.length > 0 && (
          <div className="active-filter-tags-container">
            <span className="active-filters-label">Active Filters:</span>
            <div className="active-filter-tags-list">
              {activeFilterTags.map((tag, idx) => (
                <span key={`${tag.type}-${tag.value}-${idx}`} className="active-filter-tag">
                  {tag.label}
                  <button className="remove-tag-btn" onClick={() => removeFilterTag(tag)} aria-label={`Remove filter ${tag.label}`}>×</button>
                </span>
              ))}
              <button className="clear-all-tags-btn" onClick={clearFilters}>Clear All</button>
            </div>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <section
            className="product-grid"
            style={{ gridTemplateColumns: `repeat(${itemsPerRow}, minmax(200px, 1fr))` }}
          >
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
        <div className="side-menu-overlay" onClick={() => { setIsSideMenuOpen(false); setSideMenuPage('main'); }}>
          <div className="side-menu" onClick={e => e.stopPropagation()}>
            {sideMenuPage === 'main' ? (
              <>
                <div className="side-menu-header">
                  <span>Categories</span>
                  <button className="side-menu-close" onClick={() => { setIsSideMenuOpen(false); setSideMenuPage('main'); }}>×</button>
                </div>
                {[
                  { label: 'All Watches', value: '' },
                  { label: "Men's", value: 'men' },
                  { label: "Women's", value: 'women' },
                  { label: 'Unisex', value: 'unisex' }
                ].map(cat => (
                  <button
                    key={cat.label}
                    className={`side-menu-item ${filters.gender === cat.value ? 'active' : ''}`}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, gender: cat.value, brands: [] }));
                      setIsSideMenuOpen(false);
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
                <button className="side-menu-item side-menu-item-nav" onClick={() => setSideMenuPage('brand')}>
                  Brand
                  <span className="side-menu-arrow">›</span>
                </button>
              </>
            ) : (
              <>
                <div className="side-menu-header">
                  <button className="side-menu-back" onClick={() => setSideMenuPage('main')}>‹ Back</button>
                  <button className="side-menu-close" onClick={() => { setIsSideMenuOpen(false); setSideMenuPage('main'); }}>×</button>
                </div>
                <div className="side-menu-subheader">Brand</div>
                <div className="side-menu-brand-list">
                  <button
                    className={`side-menu-item ${filters.brands.length === 0 ? 'active' : ''}`}
                    onClick={() => { setFilters(prev => ({ ...prev, brands: [] })); setIsSideMenuOpen(false); setSideMenuPage('main'); }}
                  >
                    All Brands
                  </button>
                  {[...new Set(products.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map(brand => (
                    <button
                      key={brand}
                      className={`side-menu-item ${filters.brands.includes(brand) ? 'active' : ''}`}
                      onClick={() => { setFilters(prev => ({ ...prev, gender: '', brands: [brand] })); setIsSideMenuOpen(false); setSideMenuPage('main'); }}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Small control shown at bottom of ProductPage for choosing how many items per row
const RowControl = ({ itemsPerRow, setItemsPerRow }) => {
  const [local, setLocal] = React.useState(itemsPerRow);
  useEffect(() => setLocal(itemsPerRow), [itemsPerRow]);
  const apply = () => {
    const v = Math.max(1, Math.min(8, Math.floor(Number(local) || 1)));
    setItemsPerRow(v);
    try { localStorage.setItem('itemsPerRow', String(v)); } catch {}
  };
  return (
    <div className="row-control">
      <label>Watches per row</label>
      <div className="row-control-inputs">
        <input type="number" min="1" max="8" value={local} onChange={e => setLocal(e.target.value)} />
        <button onClick={apply}>Apply</button>
      </div>
    </div>
  );
};

const ProductCard = ({ product, navigate }) => {
  const [hasError, setHasError] = React.useState(!product.image);

  const isUnavailable = product.stock === 0 || product.status === 'out_of_stock';

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product._id}`)}
      style={{ cursor: 'pointer', position: 'relative', opacity: isUnavailable ? 0.75 : 1 }}
    >
      <div className="product-image-wrapper">
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
      </div>
      {isUnavailable && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          UNAVAILABLE
        </div>
      )}

      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-name">{product.name}</h3>
        {product.discountRate > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>${product.originalPrice?.toLocaleString()}</span>
            <span className="product-price" style={{ margin: 0 }}>${product.price.toLocaleString()}</span>
            <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: '4px', padding: '1px 6px', fontWeight: 700, fontSize: '0.75rem' }}>-{product.discountRate}%</span>
          </div>
        ) : (
          <p className="product-price">${product.price.toLocaleString()}</p>
        )}
        {isUnavailable && (
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
