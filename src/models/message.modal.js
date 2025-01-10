import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            default: null,
        },
        images: [
            {
                url: {
                    type: String,

                },
                publicId: {
                    type: String,

                },
            }
        ],
        videos: [
            {
                url: {
                    type: String,

                },
                publicId: {
                    type: String,

                },
            }
        ],
        voices: {
            url: {
                type: String,

            },
            publicId: {
                type: String,

            },
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        status: {
            type: String,
            enum: ["sent", "read"],
            default: "sent",
        },
        reactions: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                emoji: { type: String },
            },
        ],
        seenBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        deletedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

export default Message;
