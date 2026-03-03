import express from 'express';
import {
    register, login, verifyOTP, refreshToken,
    resendOTP, logout, forgotPassword, resetPassword
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import {
    registerSchema, loginSchema, otpSchema,
    resendOtpSchema, forgotPasswordSchema, resetPasswordSchema
} from '../utils/validators';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-otp', validate(otpSchema), verifyOTP);
router.post('/resend-otp', validate(resendOtpSchema), resendOTP);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken); // Reads from HttpOnly cookie
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
