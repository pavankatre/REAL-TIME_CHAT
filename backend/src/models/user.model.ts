import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password?: string;
    isVerified: boolean;
    otp?: string;
    otpExpires?: Date;
    refreshToken?: string;
    role: 'user' | 'admin';
    otpAttempts: number;
    lockUntil?: Date;
    lastOtpSentAt?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    avatarUrl?: string;
    bio?: string;
    nickname?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    status: 'online' | 'offline' | 'busy';
    lastSeen: Date;
    pushSubscriptions: Array<{
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }>;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: function () {
                return !this.otp; // Password required if not logging in via OTP alone
            },
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        refreshToken: {
            type: String,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        otpAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },
        lastOtpSentAt: {
            type: Date,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        avatarUrl: {
            type: String,
        },
        bio: {
            type: String,
            maxLength: 500,
        },
        nickname: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer-not-to-say'],
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'busy'],
            default: 'offline',
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        pushSubscriptions: [
            {
                endpoint: String,
                keys: {
                    p256dh: String,
                    auth: String
                }
            }
        ]
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(12); // Using 12 salt rounds per requirement
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
