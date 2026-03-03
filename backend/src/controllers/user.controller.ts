import { Response } from 'express';
import { User } from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?._id).select('-password -otp -refreshToken -otpAttempts');

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        res.json(user);
    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error fetching profile');
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?._id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const { avatarUrl, bio, status, nickname, gender } = req.body;

        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
        if (bio !== undefined) user.bio = bio;
        if (status !== undefined) user.status = status;
        if (nickname !== undefined) user.nickname = nickname;
        if (gender !== undefined) user.gender = gender;

        const updatedUser = await user.save();

        // Broadcast status change if it was updated
        if (status !== undefined) {
            try {
                const { getIo } = require('../services/socket.service');
                const io = getIo();
                io.emit('user_status_change', { userId: updatedUser._id, status: updatedUser.status });
            } catch (err) {
                // Socket might not be initialized yet or not running in this context
            }
        }

        res.json({
            _id: updatedUser._id,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
            bio: updatedUser.bio,
            status: updatedUser.status,
            nickname: updatedUser.nickname,
            gender: updatedUser.gender,
            lastSeen: updatedUser.lastSeen
        });
    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error updating profile');
    }
};

// @desc    Get all users (for listing/online status)
// @route   GET /api/users
// @access  Private
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        // Return only necessary public fields for the user list
        const users = await User.find({}).select('_id email avatarUrl bio status lastSeen role nickname gender');
        res.json(users);
    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error fetching users');
    }
};
