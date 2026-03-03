import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { User } from '../models/user.model';
import { verifyAccessToken } from './jwt.service';
import { env } from '../config/env';

let io: Server;
const userSockets = new Map<string, string>(); // userId -> socketId

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Message } from '../models/message.model';

export const initSocketServer = async (httpServer: HttpServer) => {
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',');

    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        }
    });

    // Optional Redis Adapter for scalability
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        try {
            const pubClient = createClient({ url: redisUrl });
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);

            io.adapter(createAdapter(pubClient, subClient));
            console.log('Redis adapter integrated for Socket.io');
        } catch (error) {
            console.error('Redis adapter connection failed, falling back to memory adapter', error);
        }
    }

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = verifyAccessToken(token);
            socket.data.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket: Socket) => {
        const userId = socket.data.userId;

        // Join a personal room to track multiple connections/tabs
        socket.join(userId);

        console.log(`User connected: ${userId} (${socket.id}). Tabs: ${io.sockets.adapter.rooms.get(userId)?.size || 0}`);

        // Update user status and emit to others
        try {
            const user = await User.findById(userId);
            if (user) {
                // Only broadcast 'online' if this is the FIRST tab/connection
                if (io.sockets.adapter.rooms.get(userId)?.size === 1) {
                    const newStatus = (user.status === 'offline') ? 'online' : user.status;
                    if (user.status !== newStatus) {
                        user.status = newStatus;
                        await user.save();
                    }
                    socket.broadcast.emit('user_status_change', { userId, status: user.status });
                } else {
                    // Just sync the current status to the newly connected tab
                    socket.emit('user_status_change', { userId, status: user.status });
                }
            }
        } catch (error) {
            console.error('Error updating status on connection', error);
        }

        // --- Chat Events ---
        // ... (rest of events remain same, but using rooms for individual emits if needed)

        socket.on('join_conversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`User ${userId} joined room: ${conversationId}`);
        });

        socket.on('send_message', async (data: { conversationId: string, text: string }) => {
            try {
                const message = await Message.create({
                    conversationId: data.conversationId,
                    sender: userId,
                    text: data.text,
                    status: 'sent'
                });

                const populatedMessage = await message.populate('sender', '_id email avatarUrl');
                io.to(data.conversationId).emit('new_message', populatedMessage);
            } catch (error) {
                console.error('Error saving message', error);
            }
        });

        socket.on('typing', async (data: { conversationId: string }) => {
            const user = await User.findById(userId).select('email avatarUrl');
            socket.to(data.conversationId).emit('user_typing', { userId, user, conversationId: data.conversationId });
        });

        socket.on('stop_typing', (data: { conversationId: string }) => {
            socket.to(data.conversationId).emit('user_stop_typing', { userId, conversationId: data.conversationId });
        });

        socket.on('message_seen', async (data: { messageId: string, conversationId: string }) => {
            try {
                await Message.findByIdAndUpdate(data.messageId, {
                    $addToSet: { seenBy: userId },
                    status: 'seen'
                });
                io.to(data.conversationId).emit('message_status_update', { messageId: data.messageId, status: 'seen', seenBy: userId });
            } catch (error) {
                console.error('Error marking message seen', error);
            }
        });

        socket.on('message_delivered', async (data: { messageId: string, conversationId: string }) => {
            try {
                const msg = await Message.findById(data.messageId);
                if (msg && msg.status === 'sent') {
                    msg.status = 'delivered';
                    await msg.save();
                    io.to(data.conversationId).emit('message_status_update', { messageId: data.messageId, status: 'delivered' });
                }
            } catch (error) {
                console.error('Error marking message delivered', error);
            }
        });

        socket.on('group_updated', (data: { conversationId: string }) => {
            io.to(data.conversationId).emit('group_updated', data);
        });

        socket.on('disconnect', async () => {
            const remainingTabs = io.sockets.adapter.rooms.get(userId)?.size || 0;
            console.log(`User tab closed: ${userId}. Remaining: ${remainingTabs}`);

            if (remainingTabs === 0) {
                try {
                    const lastSeen = new Date();
                    await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen });
                    io.emit('user_status_change', { userId, status: 'offline', lastSeen });
                    console.log(`User ${userId} is now fully offline`);
                } catch (error) {
                    console.error('Error updating status on disconnect', error);
                }
            }
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
