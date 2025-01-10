import mongoose from "mongoose";

export const FriendshipSchema = new mongoose.Schema(
    {
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "blocked"],
            default: "pending",
        },
    },
    { timestamps: true }
);




const Friendship = mongoose.model("Friendship", FriendshipSchema);

export default Friendship;
