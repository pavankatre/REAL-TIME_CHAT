import { Router } from 'express';
import { PushController } from '../controllers/push.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/public-key', authenticate, PushController.getPublicKey);
router.post('/subscribe', authenticate, PushController.subscribe);
router.post('/unsubscribe', authenticate, PushController.unsubscribe);

export default router;
