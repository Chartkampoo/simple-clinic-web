import { Router } from 'express';
import { login, register, getDoctors, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/doctors', getDoctors);
router.patch('/profile', authenticate, updateProfile);

export default router;
