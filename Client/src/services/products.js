// services/products.js - VERSIÓN PARA COOKIES
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ¡IMPORTANTE! Usar withCredentials para cookies
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ← ESTO ES CRÍTICO
});

// ¡NO usar interceptor de headers! El token está en cookies

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
    console.log('📤 Enviando producto a:', '/api/products');
    const response = await api.post('/api/products', productData);
    console.log('✅ Producto creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('Detalles:', error.response?.data);
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