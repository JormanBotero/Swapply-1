// client/src/pages/Products.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/products';
import './Products.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts(filters);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
    setTimeout(() => fetchProducts(), 100);
  };

  return (
    <div className="products-page">
      <header className="products-header">
        <h1>Productos para Intercambiar</h1>
        <Link to="/products/publish" className="publish-btn">
          + Publicar Producto
        </Link>
      </header>

      {/* Filtros */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="filters-form">
          <div className="search-bar">
            <input
              type="text"
              name="search"
              placeholder="Buscar productos..."
              value={filters.search}
              onChange={handleFilterChange}
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </div>

          <div className="filter-grid">
            <select 
              name="category" 
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">Todas las categorías</option>
              <option value="electronica">Electrónica</option>
              <option value="ropa">Ropa</option>
              <option value="hogar">Hogar</option>
              <option value="libros">Libros</option>
              <option value="deportes">Deportes</option>
              <option value="otros">Otros</option>
            </select>

            <input
              type="number"
              name="minPrice"
              placeholder="Precio mínimo"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />

            <input
              type="number"
              name="maxPrice"
              placeholder="Precio máximo"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />

            <button type="submit" className="apply-btn">
              Aplicar Filtros
            </button>
            
            <button 
              type="button" 
              onClick={handleClearFilters}
              className="clear-btn"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Lista de productos */}
      <div className="products-container">
        {loading ? (
          <div className="loading">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>No hay productos disponibles</p>
            <Link to="/products/publish" className="publish-link">
              ¡Sé el primero en publicar!
            </Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <Link 
                to={`/products/${product.id}`} 
                key={product.id}
                className="product-card"
              >
                <div className="product-image">
                  {product.images && product.images[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="no-image">Sin imagen</div>
                  )}
                  {product.status === 'reserved' && (
                    <span className="status-badge reserved">Reservado</span>
                  )}
                  {product.status === 'traded' && (
                    <span className="status-badge traded">Intercambiado</span>
                  )}
                </div>
                
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <p className="product-description">
                    {product.description?.substring(0, 80)}...
                  </p>
                  
                  <div className="product-meta">
                    <span className="price">
                      {product.price ? `$${product.price}` : 'Gratis'}
                    </span>
                    <span className="category">{product.category}</span>
                  </div>
                  
                  <div className="product-footer">
                    <span className="owner">
                      📍 {product.location || 'Ubicación no especificada'}
                    </span>
                    <span className="date">
                      {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;