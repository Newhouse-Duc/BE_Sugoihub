import mongoose from "mongoose";


export const HistoryPostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
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




const HistoryPost = mongoose.model("HistoryPost", HistoryPostSchema);

export default HistoryPost;
