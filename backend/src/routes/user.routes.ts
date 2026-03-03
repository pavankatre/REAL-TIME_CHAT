import express from 'express';
import { getProfile, updateProfile, getUsers } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../utils/validators';

const router = express.Router();

// Apply protect middleware to all routes in this router
router.use(protect);

router.route('/profile')
    .get(getProfile)
    .put(validate(updateProfileSchema), updateProfile);

router.route('/')
    .get(getUsers);

export default router;
