import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { initSocketServer } from './services/socket.service';
import mongoose from 'mongoose'; // Added mongoose import for direct connection

const startServer = async () => {
    await connectDB();

    // One-time migration: Ensure all messages have a status and reset user statuses
    const { Message } = require('./models/message.model');
    const { User } = require('./models/user.model');
    try {
        // Migration 1: Message status
        await Message.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'sent' } }
        );

        // Migration 2: Reset all users to offline on startup (stale online status cleanup)
        await User.updateMany(
            { status: { $ne: 'offline' } },
            { $set: { status: 'offline' } }
        );

        console.log('Database migrations and status resets completed');
    } catch (err) {
        console.error('Migration failed', err);
    }

    const PORT = env.PORT || 5000;

    const server = http.createServer(app);
    initSocketServer(server);

    server.listen(PORT, () => {
        logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();
