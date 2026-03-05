import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
    PORT: z.string().transform(Number).default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGO_URI: z.string().url(),
    JWT_SECRET: z.string().min(10),
    JWT_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_SECRET: z.string().min(10),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
    EMAIL_HOST: z.string().optional(),
    EMAIL_PORT: z.string().transform(Number).optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_FROM: z.string().email(),
    RESEND_API_KEY: z.string().startsWith('re_').optional(),
    SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
    ALLOWED_ORIGINS: z.string().default('http://localhost:4200,https://pavankatre.github.io'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('Invalid environment variables', parsedEnv.error.format());
    process.exit(1);
}

// Diagnostic logging for production debugging
console.log('--- Environment Load Check ---');
console.log('RESEND_API_KEY present in process.env:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY starts with re_:', process.env.RESEND_API_KEY?.startsWith('re_'));
console.log('------------------------------');

export const env = parsedEnv.data;
