import { Router } from 'express';
import { authController } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/me', authenticateToken, authController.getMe);

export const authRoutes = router;
