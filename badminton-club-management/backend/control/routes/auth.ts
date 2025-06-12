import { Router } from 'express';
import { signupUser, loginUser } from '../../controllers/auth.controller';

const router = Router();

// ✅ Auth Routes
router.post('/signup', signupUser);
router.post('/login', loginUser);

export default router;
