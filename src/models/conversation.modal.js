
import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        isGroup: {
            type: Boolean,
            default: false,
        },
        groupName: {
            type: String,
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: function () {
                return this.isGroup;
            },
        },
        avatar: {
            url: {
                type: String,
                default: "",
            },
            publicId: {
                type: String,
                default: "",
            },
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    { timestamps: true }
);
const Conversation = mongoose.model("Conversation", ConversationSchema);

export default Conversation;
