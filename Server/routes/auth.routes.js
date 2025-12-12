// routes/auth.routes.js
import { Router } from 'express';
import { login, logout, me, register, changePassword, googleAuth } from '../controllers/auth.controller.js';
import { requestEmailCode, verifyEmailCode } from '../controllers/email.controller.js';
import { requestPasswordReset, verifyPasswordReset, resetPassword } from '../controllers/password.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', me);
router.post('/logout', logout);
router.post('/change-password', changePassword);
router.post('/google', googleAuth);

// Email verification
router.post('/email/request-code', requestEmailCode);
router.post('/email/verify-code', verifyEmailCode);

// Password reset
router.post('/password/request', requestPasswordReset);
router.post('/password/verify', verifyPasswordReset);
router.post('/password/reset', resetPassword);

export default router;
