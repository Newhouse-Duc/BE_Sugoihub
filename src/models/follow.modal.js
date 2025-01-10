import mongoose from "mongoose";

export const FollowSchema = new mongoose.Schema(
    {
        follower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        following: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],

    },
    { timestamps: true }
);




const Follow = mongoose.model("Follow", FollowSchema);

export default Follow;
