import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Security Middleware
app.use(helmet());
app.use(
    cors({
        origin: 'http://localhost:4200', // Angular default port
        credentials: true,
    })
);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit -* ` headers
    legacyHeaders: false, // Disable the `X - RateLimit -* ` headers
});
app.use('/api', limiter);

// Express JSON parsing
app.use(express.json());
app.use(cookieParser());

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';

// Main Routes Placeholder
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
