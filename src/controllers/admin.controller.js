import User from '../models/user.modal.js';
import Post from '../models/post.modal.js'
import Comment from '../models/comment.modal.js'
import mongoose from 'mongoose';
export const changeActiveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { ban } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID của người dùng",
            });
        }

        if (typeof ban === "undefined") {
            return res.status(400).json({
                success: false,
                message: "Thiếu trạng thái ban",
            });
        }


        const user = await User.findOneAndUpdate(
            { _id: id },
            { ban },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái thành công",
            data: user.ban,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};

export const hidePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { hide } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID của bài viết",
            });
        }

        if (typeof hide === "undefined") {
            return res.status(400).json({
                success: false,
                message: "Thiếu trạng thái ban",
            });
        }


        const post = await Post.findOneAndUpdate(
            { _id: id },
            { hide },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài viết",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái thành công",
            data: post.hide,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};
export const getAllUser = async (req, res) => {
    try {

        const users = await User.find().select('-password -refreshToken').populate('friends', 'username avatar');

        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};


export const getAllPost = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const skip = (page - 1) * limit;

        const postsWithCommentCounts = await Post.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

            // Lookup để lấy danh sách comments
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments',
                },
            },

            // Đếm số lượng comments
            {
                $addFields: {
                    commentCount: { $size: '$comments' },
                },
            },

            // Lookup để lấy thông tin người tạo bài viết
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Lookup để lấy thông tin người đã like bài viết
            {
                $lookup: {
                    from: 'users',
                    localField: 'likes',
                    foreignField: '_id',
                    as: 'likedUsers',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },

            // Xóa các trường không cần thiết
            {
                $project: {
                    comments: 0,
                },
            },
        ]);

        const totalPosts = await Post.countDocuments();

        return res.status(200).json({
            success: true,
            data: postsWithCommentCounts,
            pagination: {
                total: totalPosts,
                page,
                limit,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};


export const getallUser = async (req, res) => {
    try {



        const listUser = await User.find().select(
            "-password -refreshToken -__v"
        );





        if (!listUser || listUser.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có người dùng nào"
            });
        }

        return res.status(200).json({
            success: true,
            data: listUser,

        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
}




export const countData = async (req, res) => {
    try {

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);


        const countPostsToday = await Post.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        });


        const activeUsers = await User.countDocuments({ isActive: true, ban: false });
        const inactiveUsers = await User.countDocuments({ isActive: false });
        const bannedUsers = await User.countDocuments({ ban: true });
        const countPosts = await Post.countDocuments();

        return res.status(200).json({
            success: true,
            data: {
                activeUsers,
                inactiveUsers,
                bannedUsers,
                countPosts,
                countPostsToday,
            },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};


export const getdataPost = async (req, res) => {
    try {




        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const postsTimeline = await Post.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);


        const postsStats = await Post.aggregate([
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments"
                }
            },
            {
                $project: {
                    likesCount: { $size: "$likes" },
                    commentsCount: { $size: "$comments" }
                }
            },
            {
                $group: {
                    _id: null,
                    avgLikes: { $avg: "$likesCount" },
                    avgComments: { $avg: "$commentsCount" },
                    totalLikes: { $sum: "$likesCount" },
                    totalComments: { $sum: "$commentsCount" }
                }
            }
        ]);


        const topPosts = (await Post.aggregate([
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "postId",
                    as: "comments"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "author"
                }
            },
            {
                $addFields: {
                    author: { $arrayElemAt: ["$author", 0] }
                }
            },
            {
                $project: {
                    content: 1,
                    images: 1,
                    videos: 1,
                    visibility: 1,
                    likesCount: { $size: "$likes" },
                    commentsCount: { $size: "$comments" },
                    totalInteractions: {
                        $add: [
                            { $size: "$likes" },
                            { $size: "$comments" }
                        ]
                    },
                    author: {
                        username: "$author.username",
                        avatar: "$author.avatar"
                    },
                    createdAt: 1
                }
            },
            { $sort: { totalInteractions: -1 } },
            { $limit: 1 }
        ]))[0];




        return res.status(200).json({
            success: true,
            data: {
                postsTimeline,
                stats: postsStats[0],
                topPosts
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};


export const getAllCommentByPost = async (req, res) => {
    try {

        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json(
                {
                    success: false,
                    message: "Không có bài viết cụ thể cần xem"
                }
            )
        }


        const allComment = await Comment.aggregate([
            {
                $match: {
                    postId: new mongoose.Types.ObjectId(postId),

                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "author",
                },
            },
            {
                $unwind: "$author",
            },
            {
                $addFields: {
                    likesCount: { $size: '$likes' },

                }
            },

            {
                $project: {
                    content: 1,
                    likesCount: 1,

                    authorInfo: 1,
                    parentId: 1,
                    postId: 1,
                    images: 1,
                    createdAt: 1,

                    'author._id': 1,
                    'author.username': 1,
                    'author.avatar': 1
                }
            }
        ]);
        if (allComment.length === 0) {
            return res.status(200).json(
                {
                    success: true,
                    message: "Chưa có bình luận nào  ",
                    data: allComment
                }
            )
        }
        return res.status(200).json(
            {
                success: true,
                message: "Tất cả  bình luận của bài viết ",
                data: allComment

            }
        )



    }
    catch (error) {
        return res.status(500).json(
            {
                success: false,
                message: "Lỗi server: " + error.message
            }
        )
    }
}

