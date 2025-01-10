import User from '../models/user.modal.js';
import Post from '../models/post.modal.js'

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




export const countData = async (req, res) => {
    try {
        const activeUsers = await User.countDocuments({ isActive: true, ban: false });
        const inactiveUsers = await User.countDocuments({ isActive: false });
        const bannedUsers = await User.countDocuments({ ban: true });

        const countposts = await Post.countDocuments();

        return res.status(200).json({
            success: true,
            data: {
                activeUsers,    // Người dùng đã kích hoạt và không bị ban
                inactiveUsers,  // Người dùng chưa kích hoạt
                bannedUsers,    // Người dùng bị ban
                countposts,     // Tổng số bài viết
            },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
}


