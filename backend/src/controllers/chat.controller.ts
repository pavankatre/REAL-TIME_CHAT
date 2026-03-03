import { Response } from 'express';
import { User } from '../models/user.model';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// @desc    Search users by email or role (excluding self)
// @route   GET /api/chat/search?q=query
// @access  Private
export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const query = req.query.q as string;

        if (!query) {
            res.status(400);
            throw new Error('Search query is required');
        }

        const currentUserId = req.user?._id;

        const users = await User.find({
            _id: { $ne: currentUserId },
            email: { $regex: query, $options: 'i' } // Case-insensitive regex search
        }).select('_id email nickname avatarUrl status lastSeen');

        res.json(users);
    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error searching users');
    }
};

// @desc    Get all active conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?._id;

        const conversations = await Conversation.find({
            participants: { $in: [currentUserId] }
        })
            .populate('participants', '_id email nickname avatarUrl status lastSeen')
            .populate('lastMessage')
            .sort({ updatedAt: -1 }); // Sort by latest activity

        res.json(conversations);
    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error fetching conversations');
    }
};

// @desc    Get paginated message history for a conversation, or create one if it doesn't exist
// @route   GET /api/chat/conversations/:conversationId/messages?page=1&limit=20
// @access  Private
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const currentUserId = req.user?._id;

        // Verify conversation access
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: { $in: [currentUserId] }
        });

        if (!conversation) {
            res.status(403);
            throw new Error('Not authorized to access this conversation');
        }

        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 }) // Get newest first
            .skip(skip)
            .limit(limit)
            .populate('sender', '_id email nickname');

        // Total documents count for frontend pagination knowledge
        const total = await Message.countDocuments({ conversationId });

        res.json({
            messages: messages.reverse(), // Reverse to send chronological order (oldest to newest) to UI
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + messages.length < total
            }
        });
    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error fetching messages');
    }
};

// @desc    Get or Create Conversation with a specific user
// @route   POST /api/chat/conversations
// @access  Private
export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?._id;
        const { targetUserId } = req.body;

        if (!targetUserId) {
            res.status(400);
            throw new Error('Target user ID is required');
        }

        // Check if user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            res.status(404);
            throw new Error('Target user not found');
        }

        // Find existing conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId] }
        }).populate('participants', '_id email nickname avatarUrl status lastSeen');

        if (!conversation) {
            // Create new
            const newConvo = new Conversation({
                participants: [currentUserId, targetUserId]
            });
            await newConvo.save();
            // populate it
            conversation = await Conversation.findById(newConvo._id)
                .populate('participants', '_id email nickname avatarUrl status lastSeen');
        }

        res.json(conversation);

    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error executing get/create conversation');
    }
};

// @desc    Create a new Group Conversation
// @route   POST /api/chat/groups
// @access  Private
export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?._id;
        const { groupName, participants } = req.body;

        // Ensure current user is in the group and remove duplicates
        const memberIds = Array.from(new Set([...participants, currentUserId.toString()]));

        if (memberIds.length < 2) {
            res.status(400);
            throw new Error('Group must have at least two participants');
        }

        const newGroup = await Conversation.create({
            isGroup: true,
            groupName,
            admin: currentUserId,
            participants: memberIds
        });

        const populatedGroup = await Conversation.findById(newGroup._id).populate('participants admin', '_id email nickname avatarUrl status lastSeen');

        res.status(201).json(populatedGroup);
    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error creating group');
    }
};

// @desc    Update Group Settings (Admin Only)
// @route   PUT /api/chat/groups/:id
// @access  Private
export const updateGroup = async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?._id;
        const groupId = req.params.id;
        const { groupName, addParticipants, removeParticipants } = req.body;

        const group = await Conversation.findOne({ _id: groupId, isGroup: true });

        if (!group) {
            res.status(404);
            throw new Error('Group not found');
        }

        if (group.admin?.toString() !== currentUserId.toString()) {
            res.status(403);
            throw new Error('Only the group admin can update the group');
        }

        // Update Name
        if (groupName) {
            group.groupName = groupName;
        }

        // Add participants
        if (addParticipants && addParticipants.length > 0) {
            // Filter out existing
            const newMembers = addParticipants.filter((id: string) => !group.participants.map((p: any) => p.toString()).includes(id));
            group.participants.push(...newMembers);
        }

        // Remove participants
        if (removeParticipants && removeParticipants.length > 0) {
            // Admin cannot remove themselves this way typically, but we'll protect admin just in case
            const toRemove = removeParticipants.filter((id: string) => id !== currentUserId.toString());
            group.participants = group.participants.filter((p: any) => !toRemove.includes(p.toString())) as any;
        }

        if (group.participants.length < 2) {
            res.status(400);
            throw new Error('Group must have at least two participants');
        }

        await group.save();

        const updatedGroup = await Conversation.findById(groupId).populate('participants admin', '_id email nickname avatarUrl status lastSeen');
        res.json(updatedGroup);

    } catch (error: any) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Error updating group');
    }
};
