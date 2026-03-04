import express from 'express';
import { searchUsers, getConversations, getMessages, getOrCreateConversation, createGroup, updateGroup, deleteConversation } from '../controllers/chat.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { searchUserSchema, chatHistoryQuerySchema, createGroupSchema, updateGroupSchema } from '../utils/validators';
import { z } from 'zod';

const router = express.Router();

router.use(protect);

router.get('/search', validate(searchUserSchema), searchUsers);
router.route('/conversations')
    .get(getConversations)
    .post(validate(z.object({ body: z.object({ targetUserId: z.string().regex(/^[0-9a-fA-F]{24}$/) }) })), getOrCreateConversation);

router.route('/conversations/:conversationId')
    .delete(validate(z.object({ params: z.object({ conversationId: z.string().regex(/^[0-9a-fA-F]{24}$/) }) })), deleteConversation);

router.get('/conversations/:conversationId/messages', validate(chatHistoryQuerySchema), getMessages);

router.post('/groups', validate(createGroupSchema), createGroup);
router.put('/groups/:id', validate(updateGroupSchema), updateGroup);

export default router;
