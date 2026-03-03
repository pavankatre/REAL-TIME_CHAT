import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
    userId: string;
}

export const generateAccessToken = (userId: string): string => {
    return jwt.sign({ userId } as TokenPayload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as any,
    });
};

export const generateRefreshToken = (userId: string): string => {
    return jwt.sign({ userId } as TokenPayload, env.REFRESH_TOKEN_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
    });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload;
};
