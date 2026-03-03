import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters long'),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const otpSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    }),
});

export const resendOtpSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
        bio: z.string().max(500, 'Bio must be at most 500 characters').optional().or(z.literal('')),
        status: z.enum(['online', 'offline', 'busy']).optional(),
    }),
});

export const searchUserSchema = z.object({
    query: z.object({
        q: z.string().min(1, 'Search query is required'),
    }),
});

export const chatHistoryQuerySchema = z.object({
    params: z.object({
        conversationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Conversation ID'),
    }),
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});

export const createGroupSchema = z.object({
    body: z.object({
        groupName: z.string().min(1, 'Group name is required').max(50, 'Group name too long'),
        participants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID')).min(1, 'At least one participant required')
    })
});

export const updateGroupSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Group ID'),
    }),
    body: z.object({
        groupName: z.string().min(1, 'Group name cannot be empty').max(50, 'Group name too long').optional(),
        addParticipants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID')).optional(),
        removeParticipants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID')).optional(),
    })
});
