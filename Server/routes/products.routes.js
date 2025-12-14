// server/routes/products.routes.js
import { Router } from 'express';
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  expressInterest 
} from '../controllers/product.controller.js';

const router = Router();

// Obtener todos los productos (con filtros opcionales)
router.get('/', getProducts);

// Obtener un producto específico
router.get('/:id', getProductById);

// Crear un nuevo producto
router.post('/', createProduct);

// Actualizar un producto
router.put('/:id', updateProduct);

// Eliminar un producto
router.delete('/:id', deleteProduct);

// Mostrar interés en un producto
router.post('/:id/interest', expressInterest);

export default router;