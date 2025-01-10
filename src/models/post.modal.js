import mongoose from "mongoose";


export const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    hide: {
        type: Boolean,
        default: false,
    },
    visibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
    },
},


    { timestamps: true }
);




const Post = mongoose.model("Post", PostSchema);

export default Post;
