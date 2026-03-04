import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser } from '../models/user.model';
import { generateAccessToken, generateRefreshToken } from '../services/jwt.service';
import { sendOTP } from '../services/email.service';

const generateRandomOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const MAX_OTP_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 mins lock

// Helper to set HttpOnly cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400);
            throw new Error('User already exists');
        }

        const otp = generateRandomOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Send OTP first. If it fails, we don't create the user.
        try {
            await sendOTP(email, otp);
        } catch (error: any) {
            console.error('Registration failed at email step:', error);
            res.status(500);
            throw new Error(`Failed to send OTP email: ${error.message || 'Unknown error'}. Please try again.`);
        }

        const user = await User.create({
            email,
            password,
            otp,
            otpExpires,
            lastOtpSentAt: new Date(),
            isVerified: false,
        });

        res.status(201).json({
            message: 'User registered. Please check your email for the OTP.',
            userId: user._id,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.isVerified) {
            res.status(400);
            throw new Error('User is already verified');
        }

        if (user.lockUntil && user.lockUntil > new Date()) {
            res.status(403);
            throw new Error('Account is locked due to too many failed attempts. Try again later.');
        }

        if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            user.otpAttempts += 1;
            if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                await user.save();
                res.status(403);
                throw new Error('Maximum attempts reached. Account locked for 15 minutes.');
            }
            await user.save();
            res.status(400);
            throw new Error('Invalid or expired OTP');
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        res.status(200).json({
            message: 'Email verified successfully. You can now login.',
        });
    } catch (error) {
        next(error);
    }
};

export const resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.isVerified) {
            res.status(400);
            throw new Error('User is already verified');
        }

        if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt.getTime() < 60000) {
            res.status(429);
            throw new Error('Please wait 60 seconds before requesting another OTP');
        }

        const otp = generateRandomOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        user.lastOtpSentAt = new Date();
        await user.save();

        await sendOTP(user.email, otp);

        res.status(200).json({ message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        if (user.lockUntil && user.lockUntil > new Date()) {
            res.status(403);
            throw new Error('Account is locked. Try again later.');
        }

        if (!user.isVerified) {
            res.status(401);
            throw new Error('Please verify your email first');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = refreshToken;
        await user.save();

        setRefreshTokenCookie(res, refreshToken);

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Read token from HttpOnly cookie
        const token = req.cookies.refreshToken;

        if (!token) {
            res.status(401);
            throw new Error('Refresh token not found');
        }

        const user = await User.findOne({ refreshToken: token });
        if (!user) {
            res.status(403);
            throw new Error('Invalid refresh token');
        }

        // Token rotation
        const newAccessToken = generateAccessToken(user._id.toString());
        const newRefreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshTokenCookie(res, newRefreshToken);

        res.status(200).json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: undefined });
        }
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        // In production, send a URL like: http://frontend/reset-password?token=XYZ
        // For simplicity, we send the token string
        await sendOTP(user.email, `Password reset token: ${resetToken}`);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            res.status(400);
            throw new Error('Invalid or expired reset token');
        }

        user.password = newPassword; // Will be hashed via pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        next(error);
    }
};
