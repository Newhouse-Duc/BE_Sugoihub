import Post from "../models/post.modal.js";
import User from '../models/user.modal.js';
import mongoose from 'mongoose';
import Comment from "../models/comment.modal.js";
import { uploadImage, deleteImage, uploadVideo, deleteVideo } from "../uploadServices/uploadService.js";

export const getAllPostUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin userId",
            });
        }

        const user = await User.findById(id).populate('friends');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Người dùng không tồn tại",
            });
        }


        const friendIds = user.friends.map(friend => friend._id);

        const userId = new mongoose.Types.ObjectId(id);
        const posts = await Post.aggregate([
            {
                $match: {
                    $or: [
                        { user: id },
                        {
                            user: { $in: friendIds },
                            visibility: { $in: ['public', 'friends'] },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $addFields: {
                    isLiked: { $in: [userId, "$likes"] },
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    images: 1,
                    likes: 1,
                    videos: 1,
                    visibility: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    likes: 1,
                    isLiked: 1,
                    likesCount: { $size: "$likes" },
                    commentCount: 1,
                    "user._id": 1,
                    "user.username": 1,
                    "user.avatar": 1,
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments",
                },
            },

            {
                $addFields: {
                    commentCount: { $size: "$comments" },
                },
            },
            {
                $unset: "comments"
            },
            {
                $sort: { createdAt: -1 },
            },
        ]);

        return res.status(200).json({
            success: true,
            message: 'Lấy bài viết thành công',
            data: posts,

        });

    } catch (error) {
        console.log("error: ", error);
        return res.status(500).json({
            success: false,
            message: "Không lấy được bài viết",
        });
    }
};

export const getPostbyUser = async (req, res) => {
    try {
        const { id, userid } = req.params;

        if (!id || !userid) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin id hoặc userid",
            });
        }

        // Lấy thông tin bạn bè của user
        const user = await User.findById(id).populate('friends');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Người dùng không tồn tại",
            });
        }

        const friendIds = user.friends.map(friend => friend._id);
        const userId = new mongoose.Types.ObjectId(id);

        // Tạo điều kiện lọc bài viết
        const isFriend = friendIds.includes(userid);
        const visibilityCondition = isFriend ? { $in: ['public', 'friends'] } : 'public';

        const posts = await Post.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userid),
                    visibility: visibilityCondition,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $addFields: {
                    isLiked: { $in: [userId, "$likes"] },
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    images: 1,
                    likes: 1,
                    videos: 1,
                    visibility: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    likes: 1,
                    isLiked: 1,
                    likesCount: { $size: "$likes" },
                    commentCount: 1,
                    "user._id": 1,
                    "user.username": 1,
                    "user.avatar": 1,
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments",
                },
            },
            {
                $addFields: {
                    commentCount: { $size: "$comments" },
                },
            },
            {
                $unset: "comments",
            },
            {
                $sort: { createdAt: -1 },
            },
        ]);

        return res.status(200).json({
            success: true,
            message: 'Lấy bài viết thành công',
            data: posts,
        });

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({
            success: false,
            message: "Không lấy được bài viết",
        });
    }
};



export const getMyPost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin id",
            });
        }

        // Lấy ID của user đang truy cập
        const userId = new mongoose.Types.ObjectId(id);

        const posts = await Post.aggregate([
            {
                $match: {
                    user: userId,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $addFields: {
                    isLiked: { $in: [userId, "$likes"] },
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    images: 1,
                    likes: 1,
                    videos: 1,
                    visibility: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    isLiked: 1,
                    likesCount: { $size: "$likes" },
                    commentCount: 1,
                    "user._id": 1,
                    "user.username": 1,
                    "user.avatar": 1,
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments",
                },
            },
            {
                $addFields: {
                    commentCount: { $size: "$comments" },
                },
            },
            {
                $unset: "comments",
            },
            {
                $sort: { createdAt: -1 },
            },
        ]);

        if (!posts || posts.length === 0) {
            return res.status(200).json({
                success: false,
                message: "Chưa có bài viết nào",
                data: posts,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy bài viết thành công",
            data: posts,
        });
    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({
            success: false,
            message: "Không lấy được bài viết",
        });
    }
};




export const createPost = async (req, res) => {
    try {
        const { userId, content, visibility } = req.body;

        if (!content || !userId) {
            return res.status(400).json({
                success: false,
                message: "Nội dung và người dùng là bắt buộc.",
            });
        }

        let images = [];
        let videos = [];

        if (req.files) {

            if (req.files['images']) {
                images = await uploadImage(req.files['images']);
            }


            if (req.files['videos']) {
                videos = await uploadVideo(req.files['videos']);
            }
        }

        const newPost = new Post({
            user: userId,
            content,
            visibility: visibility,
            images,
            videos,
        });

        await newPost.save();

        return res.status(201).json({
            success: true,
            message: "Tạo bài viết thành công!",
            post: newPost,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message
        });
    }
}


export const uploadVideoPost = async (req, res) => {
    try {

        const uploadedVideo = await uploadVideo(req.file);

        return res.status(200).json({
            success: true,
            message: 'Upload video thành công!',
            data: uploadedVideo,
        });
    } catch (error) {
        console.error('Lỗi server:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
        });
    }
};


export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu id của post'
            });
        }

        const existingPost = await Post.findById(id);
        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài viết cần xóa.",
            });
        }

        const existingComments = await Comment.find({ postId: existingPost._id });

        const commentImageDeletePromises = existingComments.flatMap(comment =>
            comment.images
                .filter(image => image.publicId?.trim())
                .map(image => deleteImage(image.publicId))
        );

        const imageDeletePromises = existingPost.images
            .filter(image => image.publicId?.trim())
            .map(image => deleteImage(image.publicId));
        const videoDeletePromises = existingPost.videos
            .filter(video => video.publicId?.trim())
            .map(video => deleteVideo(video.publicId));
        try {

            await Promise.all([...commentImageDeletePromises, ...imageDeletePromises, ...videoDeletePromises]);
        } catch (mediaError) {
            return res.status(400).json({
                success: false,
                message: "Lỗi khi xóa file: " + mediaError.message,
            });
        }

        await Comment.deleteMany({ postId: existingPost._id });

        await Post.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            message: "Xóa bài viết thành công.",
            data: existingPost
        });
    } catch (error) {
        console.error('Lỗi server:', error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
}


export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, content, visibility } = req.body;

        // Parse JSON strings
        let imagesDelete = [];
        let videosDelete = [];

        try {
            if (req.body.imagesDelete) {
                imagesDelete = JSON.parse(req.body.imagesDelete);
            }
            if (req.body.videosDelete) {
                videosDelete = JSON.parse(req.body.videosDelete);
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            return res.status(400).json({
                success: false,
                message: "Invalid format for imagesDelete or videosDelete"
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bài viết hoặc người dùng",
            });
        }

        const existingPost = await Post.findById(id);
        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: "Bài viết không tồn tại",
            });
        }

        const updateFields = {};
        if (content) updateFields.content = content;
        if (visibility) updateFields.visibility = visibility;

        // Xử lý xóa media files
        const imageDeletePromises = imagesDelete
            .filter(publicId => publicId)
            .map(publicId => deleteImage(publicId));

        const videoDeletePromises = videosDelete
            .filter(publicId => publicId)
            .map(publicId => deleteVideo(publicId));

        if (imageDeletePromises.length > 0 || videoDeletePromises.length > 0) {
            try {
                await Promise.all([...imageDeletePromises, ...videoDeletePromises]);
            } catch (mediaError) {
                return res.status(400).json({
                    success: false,
                    message: "Lỗi khi xóa file: " + mediaError.message,
                });
            }
        }

        let images = [];
        let videos = [];

        if (req.files) {
            if (req.files['images']) {
                images = await uploadImage(req.files['images']);
            }
            if (req.files['videos']) {
                videos = await uploadVideo(req.files['videos']);
            }
        }

        updateFields.images = [
            ...existingPost.images.filter(img => !imagesDelete.includes(img.publicId)),
            ...images
        ];

        updateFields.videos = [
            ...existingPost.videos.filter(vid => !videosDelete.includes(vid.publicId)),
            ...videos
        ];

        const updatedPost = await Post.findOneAndUpdate(
            { _id: id, user: userId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(400).json({
                success: false,
                message: "Bài viết không tồn tại hoặc không thuộc về người dùng này",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật bài viết thành công",
            data: updatedPost,
        });
    } catch (error) {
        console.error('Lỗi server:', error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};


export const likePost = async (req, res) => {
    try {
        const { id, postId } = req.body;

        if (!id || !postId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu id hoặc postId"
            });
        }

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài viết"
            });
        }


        const existingLikeIndex = post.likes.findIndex(
            likeId => likeId.toString() === id
        );

        if (existingLikeIndex !== -1) {
            post.likes.splice(existingLikeIndex, 1);
            await post.save();

            return res.status(200).json({
                success: true,
                message: "Bỏ thích bài viết thành công",
                data:
                {
                    likesCount: post.likes.length,
                    isLiked: false,
                    postId: post._id,
                }
            });
        } else {
            post.likes.push(id);
            await post.save();

            return res.status(200).json({
                success: true,
                message: "Thích bài viết thành công",
                data:
                {
                    likesCount: post.likes.length,
                    isLiked: true,
                    postId: post._id,
                }
            });
        }

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message
        });
    }
};