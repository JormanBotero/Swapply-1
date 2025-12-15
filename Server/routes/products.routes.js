import { Router } from 'express';
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  expressInterest 
} from '../controllers/product.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.js'; // ← Importar

const router = Router();

// Público (puede que quieras que optionalAuth para mostrar info extra si está logueado)
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);

// Protegidas (requieren autenticación)
router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);
router.post('/:id/interest', requireAuth, expressInterest);

export default router;