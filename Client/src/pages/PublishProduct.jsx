// client/src/pages/PublishProduct.jsx
import { useState } from 'react';
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

  // ESTILOS INLINE GARANTIZADOS
  const inputStyles = {
    color: '#2d3748',
    backgroundColor: '#ffffff',
    border: '2px solid #e2e8f0'
  };

  const placeholderStyles = {
    color: '#a0aec0'
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

      // Aquí deberías subir las imágenes a un servicio como Cloudinary
      // Por ahora, usaremos URLs de placeholder
      const uploadedImages = imageUrls; // Reemplazar con URLs reales

      const productData = {
        ...formData,
        images: uploadedImages,
        price: formData.price ? parseFloat(formData.price) : 0
      };

      const result = await createProduct(productData);
      
      alert('Producto publicado exitosamente!');
      navigate(`/products/${result.id}`);
      
    } catch (error) {
      console.error('Error publishing product:', error);
      alert('Error al publicar el producto. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-page">
      {/* ESTILOS EMERGENTES PARA GARANTIZAR VISIBILIDAD */}
      <style>{`
        .publish-container input,
        .publish-container textarea,
        .publish-container select {
          color: #2d3748 !important;
          background-color: #ffffff !important;
          -webkit-text-fill-color: #2d3748 !important;
        }
        .publish-container input::placeholder,
        .publish-container textarea::placeholder {
          color: #a0aec0 !important;
          -webkit-text-fill-color: #a0aec0 !important;
          opacity: 1 !important;
        }
        .publish-container select option {
          color: #2d3748 !important;
          background-color: #ffffff !important;
        }
        .price-input .currency {
          color: #718096 !important;
        }
        .char-count {
          color: #718096 !important;
        }
        .input-hint {
          color: #718096 !important;
        }
      `}</style>
      
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
                    <img src={url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
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
                style={inputStyles}
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
                style={inputStyles}
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
                  style={inputStyles}
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
                  style={inputStyles}
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
                    style={inputStyles}
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
                  style={inputStyles}
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