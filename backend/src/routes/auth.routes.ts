import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { registerValidation, loginValidation } from '../utils/validators';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authRateLimiter, registerValidation, authController.register);
router.post('/login', authRateLimiter, loginValidation, authController.login);
router.post('/refresh', authRateLimiter, authController.refresh);

// Protected routes (require authentication)
router.get('/me', authenticateToken, authController.getProfile);
router.put('/me', authenticateToken, authController.updateProfile);
router.put('/me/password', authenticateToken, authController.changePassword);

export default router;
