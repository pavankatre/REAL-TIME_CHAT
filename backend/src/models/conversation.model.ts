import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId;
    isGroup: boolean;
    groupName?: string;
    admin?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
        },
        isGroup: {
            type: Boolean,
            default: false,
        },
        groupName: {
            type: String,
        },
        admin: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    },
    {
        timestamps: true,
    }
);

// Optional: Indexing for faster queries when searching conversations by participants
conversationSchema.index({ participants: 1 });

export const Conversation: Model<IConversation> = mongoose.model<IConversation>('Conversation', conversationSchema);
