import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/products';
import Fuse from 'fuse.js';
import './Products.css';

function Filters({ filters, onChange, onSearch, onClear }) {
  return (
    <section className="filters-section">
      <form onSubmit={onSearch} className="filters-form">
        <div className="search-bar">
          <input
            type="text"
            name="search"
            placeholder="Buscar productos..."
            value={filters.search}
            onChange={onChange}
          />
          <button type="submit" className="search-btn">🔍</button>
        </div>
        <div className="filter-grid">
          <select name="category" value={filters.category} onChange={onChange}>
            <option value="">Todas las categorías</option>
            <option value="electronica">Electrónica</option>
            <option value="ropa">Ropa</option>
            <option value="hogar">Hogar</option>
            <option value="libros">Libros</option>
            <option value="deportes">Deportes</option>
            <option value="otros">Otros</option>
          </select>
          <button type="submit" className="apply-btn">Aplicar filtros</button>
          <button type="button" onClick={onClear} className="clear-btn">Limpiar</button>
        </div>
      </form>
    </section>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-image">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=Sin+imagen';
              e.target.onerror = null;
            }}
          />
        ) : (
          <div className="no-image">
            <span>📷</span>
            <p>Sin imagen</p>
          </div>
        )}
        {product.status === 'reserved' && <span className="status-badge reserved">Reservado</span>}
        {product.status === 'traded' && <span className="status-badge traded">Intercambiado</span>}
      </div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="product-description">
          {product.description ? `${product.description.substring(0, 90)}…` : 'Sin descripción'}
        </p>
        <div className="product-meta">
          <span className="category">{product.category}</span>
          {product.price && <span className="price">${product.price}</span>}
        </div>
        <div className="product-footer">
          <span className="owner">📍 {product.location || 'Ubicación no especificada'}</span>
          <span className="date">
            {new Date(product.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // para búsqueda fuzzy
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(); // traer todos los productos
      setAllProducts(data);
      applyFilters(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data) => {
    let results = data;

    // Fuzzy search con Fuse.js
    if (filters.search) {
      const fuse = new Fuse(data, {
        keys: ['title', 'description', 'category'],
        threshold: 0.4, // sensibilidad
      });
      results = fuse.search(filters.search).map(r => r.item);
    }

    // Filtrar por categoría
    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }

    setProducts(results);
  };

  const handleChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSearch = (e) => { e.preventDefault(); applyFilters(allProducts); };
  const handleClear = () => { setFilters({ category: '', search: '' }); applyFilters(allProducts); };

  return (
    <div className="products-page">
      <header className="products-header">
        <h1>Productos para Intercambio</h1>
        <Link to="/products/publish" className="publish-btn">+ Publicar Producto</Link>
      </header>

      <Filters filters={filters} onChange={handleChange} onSearch={handleSearch} onClear={handleClear} />

      <section className="products-container">
        {loading ? (
          <div className="loading">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card"></div>)}
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>No hay productos disponibles actualmente.</p>
            <Link to="/products/publish" className="publish-link">Sé el primero en publicar un producto</Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
