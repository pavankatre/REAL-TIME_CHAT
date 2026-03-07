import { Router } from 'express';
import { PushController } from '../controllers/push.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/public-key', protect, PushController.getPublicKey);
router.post('/subscribe', protect, PushController.subscribe);
router.post('/unsubscribe', protect, PushController.unsubscribe);

export default router;
