// client/src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, expressInterest } from '../services/products';
import { me } from '../services/auth';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [interestLoading, setInterestLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchUser();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await getProductById(id);
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const data = await me();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleExpressInterest = async () => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/products/${id}` } });
      return;
    }

    if (user.id === product.owner_id) {
      alert('No puedes mostrar interés en tu propio producto');
      return;
    }

    try {
      setInterestLoading(true);
      const data = await expressInterest(id);
      
      if (data.conversationId) {
        navigate(`/chat/${data.conversationId}`);
      } else {
        setShowContact(true);
      }
    } catch (error) {
      console.error('Error expressing interest:', error);
      alert('Error al mostrar interés. Intenta nuevamente.');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleNextImage = () => {
    if (product.images && product.images.length > 0) {
      setCurrentImage((prev) => (prev + 1) % product.images.length);
    }
  };

  const handlePrevImage = () => {
    if (product.images && product.images.length > 0) {
      setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="product-detail loading">
        <div className="loading-spinner"></div>
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail not-found">
        <h2>Producto no encontrado</h2>
        <Link to="/products" className="back-btn">
          ← Volver a productos
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === product.owner_id;

  return (
    <div className="product-detail">
      <Link to="/products" className="back-link">
        ← Volver a productos
      </Link>

      <div className="product-detail-grid">
        {/* Galería de imágenes */}
        <div className="product-gallery">
          <div className="main-image">
            {product.images && product.images.length > 0 ? (
              <>
                <img 
                  src={product.images[currentImage]} 
                  alt={`${product.title} - ${currentImage + 1}`}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                  }}
                />
                {product.images.length > 1 && (
                  <>
                    <button 
                      className="nav-btn prev-btn"
                      onClick={handlePrevImage}
                    >
                      ‹
                    </button>
                    <button 
                      className="nav-btn next-btn"
                      onClick={handleNextImage}
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="no-image-large">
                Sin imágenes disponibles
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="thumbnail-grid">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === currentImage ? 'active' : ''}`}
                  onClick={() => setCurrentImage(index)}
                >
                  <img 
                    src={img} 
                    alt={`Miniatura ${index + 1}`}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x80?text=Imagen';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="product-info-detail">
          <div className="product-header">
            <div className="status-badge-detail">
              {product.status === 'available' && (
                <span className="available">Disponible</span>
              )}
              {product.status === 'reserved' && (
                <span className="reserved">Reservado</span>
              )}
              {product.status === 'traded' && (
                <span className="traded">Intercambiado</span>
              )}
            </div>
            <h1>{product.title}</h1>
            <div className="price-detail">
              {product.price ? `$${product.price}` : 'Gratis'}
            </div>
          </div>

          <div className="product-meta-detail">
            <div className="meta-item">
              <span className="meta-label">Categoría:</span>
              <span className="meta-value">{product.category || 'No especificada'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Condición:</span>
              <span className="meta-value">{product.condition || 'No especificada'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Ubicación:</span>
              <span className="meta-value">{product.location || 'No especificada'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Publicado:</span>
              <span className="meta-value">
                {new Date(product.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="product-description-detail">
            <h3>Descripción</h3>
            <p>{product.description || 'No hay descripción disponible.'}</p>
          </div>

          {/* Información del vendedor */}
          <div className="seller-info">
            <h3>Publicado por</h3>
            <div className="seller-card">
              <div className="seller-avatar">
                {product.owner_picture ? (
                  <img src={product.owner_picture} alt={product.owner_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {product.owner_name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="seller-details">
                <h4>{product.owner_name}</h4>
                <p className="member-since">
                  Miembro desde {new Date().getFullYear()} {/* Esto deberías obtenerlo del usuario */}
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="action-buttons">
            {product.status === 'available' && !isOwner && (
              <button 
                className="interest-btn"
                onClick={handleExpressInterest}
                disabled={interestLoading}
              >
                {interestLoading ? (
                  <span className="loading-btn">Cargando...</span>
                ) : (
                  <>
                    <span className="icon">💬</span>
                    Mostrar Interés
                  </>
                )}
              </button>
            )}

            {isOwner && (
              <div className="owner-actions">
                <Link 
                  to={`/products/edit/${product.id}`}
                  className="edit-btn"
                >
                  ✏️ Editar Producto
                </Link>
                <button className="delete-btn">
                  🗑️ Eliminar
                </button>
              </div>
            )}

            {showContact && (
              <div className="contact-info">
                <h4>Información de contacto:</h4>
                <p>Puedes contactar al vendedor mediante el chat</p>
              </div>
            )}

            {product.status === 'reserved' && (
              <div className="status-message">
                ⚠️ Este producto está actualmente reservado
              </div>
            )}

            {product.status === 'traded' && (
              <div className="status-message">
                ✅ Este producto ya ha sido intercambiado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;