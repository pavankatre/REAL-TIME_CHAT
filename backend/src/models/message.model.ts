import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text: string;
    status: 'sent' | 'delivered' | 'seen';
    seenBy: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'seen'],
            default: 'sent',
        },
        seenBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexing for fetching messages of a specific conversation quickly sorted by time
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
