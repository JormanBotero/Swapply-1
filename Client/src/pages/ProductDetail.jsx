// client/src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, expressInterest } from '../services/products';
import { me } from '../services/auth';
import { initSocket, notifyProductInterest } from '../services/socket';
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
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchProduct();
    fetchUser();
    setupSocket();
  }, [id]);

  const setupSocket = () => {
    const socketInstance = initSocket();
    setSocket(socketInstance);
    
    // Escuchar notificaciones de interés
    socketInstance?.on('new-interest-notification', (data) => {
      console.log('Nuevo interés recibido:', data);
      // Podrías mostrar una notificación aquí
    });
  };

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
        // Notificar al dueño del producto vía WebSocket
        if (socket) {
          notifyProductInterest({
            productId: id,
            productOwnerId: product.owner_id,
            interestedUserId: user.id,
            productTitle: product.title
          });
        }
        
        // Redirigir directamente al chat
        navigate(`/chat/${data.conversationId}`);
      } else {
        setShowContact(true);
        // Intentar crear conversación manualmente
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      }
    } catch (error) {
      console.error('Error expressing interest:', error);
      
      // Fallback: crear chat manualmente y redirigir
      if (error.response?.status === 404 || error.response?.status === 500) {
        const fallbackConversationId = Date.now(); // ID temporal
        alert('Redirigiendo al chat...');
        navigate(`/chat/${fallbackConversationId}`);
      } else {
        alert('Error al mostrar interés. Intenta nuevamente.');
      }
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

  const handleStartChat = () => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/products/${id}` } });
      return;
    }

    if (user.id === product.owner_id) {
      alert('No puedes chatear contigo mismo');
      return;
    }

    // Crear conversación temporal
    const tempConversationId = `temp_${product.owner_id}_${user.id}_${id}`;
    navigate(`/chat/${tempConversationId}`, {
      state: {
        productInfo: {
          id: product.id,
          title: product.title,
          ownerId: product.owner_id,
          ownerName: product.owner_name
        }
      }
    });
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
                <span className="available">🟢 Disponible</span>
              )}
              {product.status === 'reserved' && (
                <span className="reserved">🟡 Reservado</span>
              )}
              {product.status === 'traded' && (
                <span className="traded">🔵 Intercambiado</span>
              )}
            </div>
            <h1>{product.title}</h1>
            <div className="price-detail">
              {product.price ? `$${product.price}` : '🆓 Gratis'}
            </div>
          </div>

          <div className="product-meta-detail">
            <div className="meta-item">
              <span className="meta-label">📂 Categoría:</span>
              <span className="meta-value">{product.category || 'No especificada'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">🏷️ Condición:</span>
              <span className="meta-value">{product.condition || 'No especificada'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">📍 Ubicación:</span>
              <span className="meta-value">{product.location || 'No especificada'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">📅 Publicado:</span>
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
            <h3>📝 Descripción</h3>
            <p className="description-text">{product.description || 'No hay descripción disponible.'}</p>
          </div>

          {/* Información del vendedor */}
          <div className="seller-info">
            <h3>👤 Publicado por</h3>
            <div className="seller-card">
              <div className="seller-avatar">
                {product.owner_picture ? (
                  <img src={product.owner_picture} alt={product.owner_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {product.owner_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="seller-details">
                <h4>{product.owner_name || 'Usuario'}</h4>
                <div className="seller-actions">
                  <button 
                    className="view-profile-btn"
                    onClick={() => alert('Perfil del usuario - En desarrollo')}
                  >
                    Ver Perfil
                  </button>
                  {!isOwner && (
                    <button 
                      className="direct-chat-btn"
                      onClick={handleStartChat}
                    >
                      💬 Chat Directo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="action-buttons">
            {product.status === 'available' && !isOwner && (
              <>
                <button 
                  className="interest-btn primary"
                  onClick={handleExpressInterest}
                  disabled={interestLoading}
                >
                  {interestLoading ? (
                    <span className="loading-btn">
                      <div className="small-spinner"></div>
                      Procesando...
                    </span>
                  ) : (
                    <>
                      <span className="icon">🤝</span>
                      Mostrar Interés
                      <span className="btn-subtitle">(Te lleva al chat)</span>
                    </>
                  )}
                </button>
                
                <button 
                  className="interest-btn secondary"
                  onClick={handleStartChat}
                >
                  <span className="icon">💬</span>
                  Solo Chatear
                  <span className="btn-subtitle">(Preguntar sobre el producto)</span>
                </button>
              </>
            )}

            {isOwner && (
              <div className="owner-actions">
                <div className="owner-buttons">
                  <Link 
                    to={`/products/edit/${product.id}`}
                    className="edit-btn"
                  >
                    <span className="icon">✏️</span>
                    Editar Producto
                  </Link>
                  <button 
                    className="delete-btn"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de eliminar este producto?')) {
                        alert('Función de eliminación en desarrollo');
                      }
                    }}
                  >
                    <span className="icon">🗑️</span>
                    Eliminar
                  </button>
                </div>
                
                <div className="owner-stats">
                  <div className="stat-item">
                    <span className="stat-label">Vistas:</span>
                    <span className="stat-value">0</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Intereses:</span>
                    <span className="stat-value">0</span>
                  </div>
                </div>
              </div>
            )}

            {showContact && (
              <div className="contact-info">
                <h4>📞 Información de contacto:</h4>
                <p>Puedes contactar al vendedor mediante el chat. Ya te hemos redirigido.</p>
                <button 
                  className="go-to-chat-btn"
                  onClick={() => navigate('/chat')}
                >
                  Ir al Chat
                </button>
              </div>
            )}

            {product.status === 'reserved' && (
              <div className="status-message warning">
                <span className="icon">⚠️</span>
                <div>
                  <strong>Este producto está actualmente reservado</strong>
                  <p>Puedes contactar al vendedor por si la reserva no se concreta.</p>
                  {!isOwner && (
                    <button 
                      className="contact-anyway-btn"
                      onClick={handleStartChat}
                    >
                      Contactar de todas formas
                    </button>
                  )}
                </div>
              </div>
            )}

            {product.status === 'traded' && (
              <div className="status-message success">
                <span className="icon">✅</span>
                <div>
                  <strong>Este producto ya ha sido intercambiado</strong>
                  <p>Busca otros productos similares en nuestra plataforma.</p>
                  <Link to="/products" className="browse-more-btn">
                    Explorar más productos
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sección de chat rápido (para dueños) */}
          {isOwner && (
            <div className="quick-chat-section">
              <h3>💬 Conversaciones sobre este producto</h3>
              <div className="chat-preview">
                <p>Cuando alguien muestre interés en tu producto, aparecerán las conversaciones aquí.</p>
                <Link to="/chat" className="view-chats-btn">
                  Ver todas mis conversaciones
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;