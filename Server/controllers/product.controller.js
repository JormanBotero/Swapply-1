// server/controllers/product.controller.js - VERSIÓN CORREGIDA
import * as ProductModel from '../models/Product.js';
import * as ConversationModel from '../models/Conversation.js';

// Obtener todos los productos
export const getProducts = async (req, res) => {
  try {
    const filters = req.query;
    const products = await ProductModel.findProducts(filters);
    res.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findProductById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
};

// Crear un nuevo producto
export const createProduct = async (req, res) => {
  try {
    // USAMOS req.user.id DEL MIDDLEWARE DE AUTENTICACIÓN
    const userId = req.user.id;
    
    // Validar datos requeridos
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: título, descripción y categoría' 
      });
    }
    
    const productData = {
      ...req.body,
      owner_id: userId,
      images: req.body.images || [],
      location: req.body.location || '',
      condition: req.body.condition || 'nuevo',
      status: 'available'
    };
    
    const product = await ProductModel.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // USAMOS req.user.id DEL MIDDLEWARE DE AUTENTICACIÓN
    const userId = req.user.id;
    
    // Verificar que el producto existe
    const product = await ProductModel.findProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Verificar que el usuario es el dueño
    if (product.owner_id !== userId) {
      return res.status(403).json({ error: 'No autorizado para editar este producto' });
    }
    
    // Campos permitidos para actualizar
    const allowedUpdates = ['title', 'description', 'category', 'condition', 'images', 'location', 'status'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }
    
    const updatedProduct = await ProductModel.updateProduct(id, updates);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

// Eliminar un producto
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // USAMOS req.user.id DEL MIDDLEWARE DE AUTENTICACIÓN
    const userId = req.user.id;
    
    const deleted = await ProductModel.deleteProduct(id, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado o no autorizado' });
    }
    
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
};

// Mostrar interés en un producto
export const expressInterest = async (req, res) => {
  try {
    const { id } = req.params;
    // USAMOS req.user.id DEL MIDDLEWARE DE AUTENTICACIÓN
    const userId = req.user.id;
    
    console.log('Usuario mostrando interés:', userId); // Para debugging
    
    // Obtener el producto
    const product = await ProductModel.findProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Verificar que no sea el dueño
    if (product.owner_id === userId) {
      return res.status(400).json({ 
        error: 'No puedes mostrar interés en tu propio producto' 
      });
    }
    
    // Crear o obtener conversación
    const conversation = await ConversationModel.findOrCreateConversation(
      userId,
      product.owner_id,
      id
    );
    
    // Actualizar última actividad
    await ConversationModel.updateConversationLastMessage(
      conversation.id, 
      `Interés mostrado en: ${product.title}`
    );
    
    res.json({
      success: true,
      message: 'Interés expresado exitosamente',
      conversationId: conversation.id,
      productId: id,
      productTitle: product.title
    });
  } catch (error) {
    console.error('Error expressing interest:', error);
    res.status(500).json({ error: 'Error al mostrar interés' });
  }
};