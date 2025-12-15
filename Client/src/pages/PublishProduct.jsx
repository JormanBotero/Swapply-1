// client/src/pages/PublishProduct.jsx - VERSIÓN CORREGIDA
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../services/products';
import { me } from '../services/auth';
import './PublishProduct.css';

function PublishProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'nuevo',
    price: '',
    location: '',
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
      setLoading(true);
      
      // Primero verificar que el usuario esté autenticado
      const user = await me();
      if (!user) {
        navigate('/login', { state: { returnTo: '/products/publish' } });
        return;
      }

      // ==================== CORRECCIÓN: SUBIR IMÁGENES REALES ====================
      // En una implementación real, aquí subirías las imágenes a Cloudinary o similar
      // Por ahora, convertimos blobs a base64 o mantenemos URLs existentes
      const uploadedImages = await Promise.all(
        imageUrls.map(async (url, index) => {
          if (url.startsWith('blob:')) {
            // Convertir blob a base64 (solución temporal)
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }
          return url; // Si ya es una URL normal (no blob), mantenerla
        })
      );

      const productData = {
        ...formData,
        images: uploadedImages,
        price: formData.price ? parseFloat(formData.price) : 0
      };

      console.log('Enviando producto:', productData);
      const result = await createProduct(productData);
      
      // Limpiar blobs después de enviar
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      alert('✅ Producto publicado exitosamente!');
      navigate(`/products/${result.id}`);
      
    } catch (error) {
      console.error('Error publishing product:', error);
      alert('❌ Error al publicar el producto: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-page">
      <div className="publish-container">
        <header className="publish-header">
          <h1>Publicar Nuevo Producto</h1>
          <p>Comparte lo que ya no usas y encuentra algo que necesites</p>
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
                  disabled={images.length >= 5}
                />
                <div className="upload-content">
                  <span className="upload-icon">📷</span>
                  <span className="upload-text">
                    {images.length === 0 
                      ? 'Haz clic para subir imágenes' 
                      : 'Subir más imágenes'}
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
                placeholder="Describe tu producto con detalle. Incluye información sobre el estado, accesorios incluidos, razones por las que lo vendes, etc."
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
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/products')}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Publicando...
                </>
              ) : (
                'Publicar Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublishProduct;