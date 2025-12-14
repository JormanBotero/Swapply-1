
import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

// Obtener todos los productos
export async function getProducts(filters = {}) {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/api/products?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    // Retornar array vacío en caso de error para que la UI funcione
    return [];
  }
}

// Obtener un producto por ID
export async function getProductById(id) {
  try {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

// Crear un nuevo producto
export async function createProduct(productData) {
  try {
    const response = await api.post('/api/products', productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Mostrar interés en un producto
export async function expressInterest(productId) {
  try {
    const response = await api.post(`/api/products/${productId}/interest`);
    return response.data;
  } catch (error) {
    console.error('Error expressing interest:', error);
    throw error;
  }
}

// Actualizar producto
export async function updateProduct(id, productData) {
  try {
    const response = await api.put(`/api/products/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Eliminar producto
export async function deleteProduct(id) {
  try {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}