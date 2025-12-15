// client/src/pages/EditProduct.jsx - VERSIÓN CORREGIDA
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, updateProduct, deleteProduct } from '../services/products';
import './PublishProduct.css';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'nuevo',
    price: '',
    location: '',
    status: 'available',
    images: []
  });

  const categories = [
    { value: 'electronica', label: 'Electrónica' },
    { value: 'ropa', label: 'Ropa y Accesorios' },
    { value: 'hogar', label: 'Hogar y Jardín' },
    { value: 'libros', label: 'Libros y Educación' },
    { value: 'deportes', label: 'Deportes y Ocio' },
    { value: 'vehiculos', label: 'Vehículos' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'otros', label: 'Otros' }
  ];

  const conditions = [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'como_nuevo', label: 'Como nuevo' },
    { value: 'bueno', label: 'Buen estado' },
    { value: 'aceptable', label: 'Aceptable' },
    { value: 'necesita_reparacion', label: 'Necesita reparación' }
  ];

  const statuses = [
    { value: 'available', label: 'Disponible' },
    { value: 'reserved', label: 'Reservado' },
    { value: 'traded', label: 'Intercambiado' }
  ];

  // ==================== NUEVO: LIMPIEZA DE BLOB URLs ====================
  useEffect(() => {
    return () => {
      // Limpiar URLs blob al desmontar el componente
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const product = await getProductById(id);
      
      setFormData({
        title: product.title || '',
        description: product.description || '',
        category: product.category || '',
        condition: product.condition || 'nuevo',
        price: product.price?.toString() || '',
        location: product.location || '',
        status: product.status || 'available',
        images: product.images || []
      });

      // Si hay imágenes, cargarlas para previsualización
      if (product.images && product.images.length > 0) {
        setImageUrls(product.images);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('❌ Error al cargar el producto');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert('Máximo 5 imágenes permitidas');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Crear URLs para previsualización
    const newUrls = files.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newUrls]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newUrls = [...imageUrls];
    
    // Liberar URL blob antes de eliminarla
    if (imageUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(imageUrls[index]);
    }
    
    newImages.splice(index, 1);
    newUrls.splice(index, 1);
    
    setImages(newImages);
    setImageUrls(newUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      // Convertir blobs a base64 y mantener URLs existentes
      const processedImages = await Promise.all(
        imageUrls.map(async (url) => {
          if (url.startsWith('blob:')) {
            // Convertir blob a base64
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }
          return url; // Mantener URL existente
        })
      );

      const productData = {
        ...formData,
        images: processedImages,
        price: formData.price ? parseFloat(formData.price) : 0
      };

      await updateProduct(id, productData);
      
      // Limpiar blobs después de guardar
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      alert('✅ Producto actualizado exitosamente!');
      navigate(`/products/${id}`);
      
    } catch (error) {
      console.error('Error updating product:', error);
      alert('❌ Error al actualizar el producto: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?\nEsta acción no se puede deshacer.')) {
      try {
        setSaving(true);
        await deleteProduct(id);
        
        // Limpiar blobs antes de salir
        imageUrls.forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        
        alert('✅ Producto eliminado exitosamente');
        navigate('/products');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('❌ Error al eliminar el producto: ' + (error.response?.data?.error || error.message));
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="publish-page">
        <div className="publish-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="publish-page">
      <div className="publish-container">
        <header className="publish-header">
          <h1>Editar Producto</h1>
          <p>Actualiza la información de tu producto</p>
        </header>

        <form onSubmit={handleSubmit} className="publish-form">
          {/* Sección de imágenes */}
          <div className="form-section">
            <h2>Imágenes del producto</h2>
            <p className="section-subtitle">Sube hasta 5 imágenes (la primera será la principal)</p>
            
            <div className="image-upload-area">
              <label className="upload-label">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                  disabled={imageUrls.length >= 5}
                />
                <div className="upload-content">
                  <span className="upload-icon">📷</span>
                  <span className="upload-text">
                    {imageUrls.length === 0 
                      ? 'Haz clic para subir imágenes' 
                      : 'Agregar más imágenes'}
                  </span>
                  <span className="upload-hint">
                    Máximo 5 imágenes • PNG, JPG, GIF
                  </span>
                </div>
              </label>
            </div>

            {imageUrls.length > 0 && (
              <div className="image-preview-grid">
                {imageUrls.map((url, index) => (
                  <div key={index} className="image-preview">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x150?text=Error';
                        e.target.onerror = null;
                      }}
                    />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                      aria-label="Eliminar imagen"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span className="main-label">Principal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información básica */}
          <div className="form-section">
            <h2>Información del producto</h2>
            
            <div className="form-group">
              <label htmlFor="title">
                Título del producto *
                <span className="char-count">
                  {formData.title.length}/60
                </span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ej: iPhone 12 en perfecto estado"
                maxLength={60}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Descripción detallada *
                <span className="char-count">
                  {formData.description.length}/2000
                </span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe tu producto con detalle..."
                rows={6}
                maxLength={2000}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Categoría *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condición</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  {conditions.map(cond => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Precio ($)</label>
                <div className="price-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="input-hint">
                  Dejar en 0 para intercambio/gratis
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="location">Ubicación</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Ciudad, Estado"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Estado del producto</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(`/products/${id}`)}
              disabled={saving}
            >
              Cancelar
            </button>
            
            <button
              type="button"
              className="delete-btn"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Eliminando...' : 'Eliminar Producto'}
            </button>
            
            <button
              type="submit"
              className="submit-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProduct;