import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, updateProduct, deleteProduct } from '../services/products';
import { expressInterest } from '../services/chat';
import { me } from '../services/auth';
import { initSocket, notifyProductInterest } from '../services/socket';
import './ProductDetail.css';

function ImageGallery({ images, current, onNext, onPrev, onSelect, editable, onRemove, onAdd }) {
  return (
    <div className="gallery-container">
      <div className="main-image">
        {images && images.length > 0 ? images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Imagen ${i + 1}`}
            className={i === current ? 'active' : ''}
            onError={(e) => { e.target.src='https://via.placeholder.com/600x400?text=No+Image'; }}
          />
        )) : <div className="no-image-large">Sin imágenes disponibles</div>}

        {images && images.length > 1 && (
          <>
            <button className="nav-btn prev-btn" onClick={onPrev}>‹</button>
            <button className="nav-btn next-btn" onClick={onNext}>›</button>
          </>
        )}
      </div>

      <div className="thumbnail-grid">
        {images.map((img, i) => (
          <div key={i} className="thumbnail-wrapper">
            <img className="thumbnail" src={img} alt={`Miniatura ${i + 1}`} onClick={() => onSelect(i)} />
            {editable && <button className="remove-img-btn" onClick={() => onRemove(i)}>×</button>}
          </div>
        ))}
        {editable && (
          <div className="thumbnail-wrapper">
            <label className="thumbnail add-img-btn">
              +
              <input type="file" style={{ display: 'none' }} onChange={onAdd} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function SellerCard({ owner, isOwner }) {
  return (
    <div className="seller-card">
      <div className="seller-avatar">
        {owner.picture ? (
          <img src={owner.picture} alt={owner.name} />
        ) : (
          <div className="avatar-placeholder">{owner.name?.charAt(0) || 'U'}</div>
        )}
      </div>
      <div className="seller-details">
        <h4>{owner.name || 'Usuario'}</h4>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [interestLoading, setInterestLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    status: '',
    images: []
  });

  useEffect(() => {
    fetchProduct();
    fetchUser();
    const s = initSocket();
    setSocket(s);
    s?.on('new-interest-notification', data => console.log('Nuevo interés:', data));
  }, [id]);

  useEffect(() => {
    if (product) {
      setEditForm({
        title: product.title || '',
        description: product.description || '',
        category: product.category || '',
        status: product.status || 'available',
        images: product.images || []
      });
    }
  }, [product]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchUser = async () => {
    try { setUser(await me()); } catch(e){ console.error(e); }
  };

  const handleExpressInterest = async () => {
    if (!user) return navigate('/login', { state: { returnTo: `/products/${id}` } });
    if (user.id === product.owner_id) return alert('No puedes mostrar interés en tu propio producto');
    try {
      setInterestLoading(true);
      const data = await expressInterest(id);
      if (data.conversationId && socket) {
        notifyProductInterest({ productId: id, productOwnerId: product.owner_id, interestedUserId: user.id, productTitle: product.title });
        navigate(`/chat/${data.conversationId}`);
      } else {
        setTimeout(() => navigate('/chat'), 2000);
      }
    } catch(e){ console.error(e); alert('Error al mostrar interés'); }
    finally { setInterestLoading(false); }
  };

  const handleStartChat = () => {
    if (!user) return navigate('/login', { state: { returnTo: `/products/${id}` } });
    if (user.id === product.owner_id) return alert('No puedes chatear contigo mismo');
    const tempConversationId = `temp_${product.owner_id}_${user.id}_${id}`;
    navigate(`/chat/${tempConversationId}`, { state: { productInfo: { id: product.id, title: product.title, ownerId: product.owner_id, ownerName: product.owner_name } } });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageRemove = (index) => {
    setEditForm(prev => {
      const imgs = [...prev.images];
      imgs.splice(index, 1);
      return { ...prev, images: imgs };
    });
  };

  const handleImageAdd = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm(prev => ({ ...prev, images: [...prev.images, reader.result] }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    try {
      const updated = await updateProduct(product.id, editForm);
      setProduct(updated);
      setIsEditing(false);
    } catch(e){ console.error(e); alert('No se pudo actualizar el producto'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Deseas eliminar este producto?')) return;
    try {
      await deleteProduct(product.id);
      navigate('/products');
    } catch(e){ console.error(e); alert('No se pudo eliminar el producto'); }
  };

  if (loading) return <div className="product-detail loading"><div className="loading-spinner"></div><p>Cargando producto...</p></div>;
  if (!product) return <div className="product-detail not-found"><h2>Producto no encontrado</h2><Link to="/products" className="back-btn">← Volver a productos</Link></div>;

  const isOwner = user?.id === product.owner_id;

  return (
    <div className="product-detail">
      <Link to="/products" className="back-link">← Volver a productos</Link>
      <div className="product-detail-grid">
        <ImageGallery 
          images={isEditing ? editForm.images : product.images}
          current={currentImage}
          onNext={() => setCurrentImage((currentImage+1) % (isEditing ? editForm.images.length : product.images.length))}
          onPrev={() => setCurrentImage((currentImage-1 + (isEditing ? editForm.images.length : product.images.length)) % (isEditing ? editForm.images.length : product.images.length))}
          onSelect={setCurrentImage}
          editable={isOwner && isEditing}
          onRemove={handleImageRemove}
          onAdd={handleImageAdd}
        />

        <div className="product-info-detail">
          {!isEditing ? (
            <>
              <div className="product-header">
                <h1>{product.title}</h1>
                <div className={`status-badge-detail ${product.status}`}>{product.status.toUpperCase()}</div>
              </div>

              <div className="product-meta-detail">
                <div><strong>📂 Categoría:</strong> {product.category || 'No especificada'}</div>
                <div><strong>📍 Ubicación:</strong> {product.location || 'No especificada'}</div>
                <div><strong>📅 Publicado:</strong> {new Date(product.created_at).toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'})}</div>
              </div>

              <div className="product-description-detail">
                <h3>📝 Descripción</h3>
                <p>{product.description || 'No hay descripción disponible.'}</p>
              </div>

              <SellerCard owner={{ name: product.owner_name, picture: product.owner_picture }} isOwner={isOwner} />

              {!isOwner && product.status==='available' && (
                <div className="action-buttons">
                  <button
                    className="interest-btn primary"
                    onClick={handleExpressInterest}
                    disabled={interestLoading}
                  >
                    {interestLoading ? 'Procesando...' : '🤝 Mostrar Interés'}
                  </button>
                  <button
                    className="interest-btn secondary"
                    onClick={handleStartChat}
                  >
                    💬 Chat Directo
                  </button>
                </div>
              )}

              {isOwner && (
                <div className="owner-actions">
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Editar Producto</button>
                  <button className="delete-btn" onClick={handleDelete}>🗑️ Eliminar</button>
                </div>
              )}
            </>
          ) : (
            <div className="edit-form">
              <input name="title" value={editForm.title} onChange={handleEditChange} placeholder="Título" />
              <textarea name="description" value={editForm.description} onChange={handleEditChange} placeholder="Descripción" />
              <select name="category" value={editForm.category} onChange={handleEditChange}>
                <option value="electronica">Electrónica</option>
                <option value="ropa">Ropa</option>
                <option value="hogar">Hogar</option>
                <option value="libros">Libros</option>
                <option value="deportes">Deportes</option>
                <option value="otros">Otros</option>
              </select>
              <select name="status" value={editForm.status} onChange={handleEditChange}>
                <option value="available">Disponible</option>
                <option value="reserved">Reservado</option>
                <option value="traded">Intercambiado</option>
              </select>
              <div className="edit-form-buttons">
                <button className="save-btn" onClick={handleSaveChanges}>Guardar Cambios</button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
