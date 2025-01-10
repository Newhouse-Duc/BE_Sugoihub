import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
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
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
    },
    { timestamps: true }
);

const Comment = mongoose.model("Comment", CommentSchema);

export default Comment;
