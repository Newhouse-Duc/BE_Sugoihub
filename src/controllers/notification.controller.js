import Notification from "../models/notification.modal.js";
import User from '../models/user.modal.js';
import Follow from "../models/follow.modal.js";


export const newNotification = async (data) => {
    try {
        const { recipient, sender, type, entityType, entityId, text, link } = data;

        if (!recipient || !sender || !type || !entityType || !entityId || !text) {
            return {
                success: false,
                message: "Thiếu dữ liệu cần thiết"
            };
        }

        const validTypes = [
            'POST_LIKE',
            'POST_BLOCKED',
            'POST_COMMENT',
            'COMMENT_REPLY',
            'COMMENT_LIKE',
            'FRIEND_REQUEST',
            'FRIEND_ACCEPT',
        ];
        if (!validTypes.includes(type)) {
            return {
                success: false,
                message: `Loại thông báo không hợp lệ: ${type}`
            }

        }


        const newnotification = await Notification.createInteractionNotification({
            recipient,
            sender,
            type,
            entityType,
            entityId,
            text,
            link: link || ''
        });
        const notification = await Notification.findById(newnotification._id).populate('sender', 'username avatar')
        return {
            success: true,
            message: "Thông báo thích bài viết đã được tạo",
            notification,
        };

    } catch (error) {
        return {
            success: false,
            message: "Lỗi server: " + error.message,
        };
    }
};


export const getAllNotification = async (req, res) => {
    try {

        const id = req.user._id;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu dữ liệu"
            });
        }
        const limit = parseInt(req.query.limit) || 5;
        const skip = parseInt(req.query.skip) || 0;
        const options = { limit, skip };
        const notification = await Notification.getNotifications(id, options)
        if (notification.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Chưa có thông báo nào ",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tất cả thông báo  ",
            data: notification
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message
        });
    }
}
export const isReadNotification = async (req, res) => {
    try {
        const notificationIds = req.body;

        const result = await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                isRead: false
            },
            {
                isRead: true
            },
            { new: true }
        );

        if (result.matchedCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thông báo không tồn tại hoặc không thuộc sở hữu của bạn.'
            });
        }
        return res.status(200).json({
            success: true,
            message: "Thông báo đã được đánh dấu là đã đọc",
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message
        });
    }
}
export const newPostNotification = async (data) => {
    try {

        const { postId, authorId } = data;
        const [authorData, followData] = await Promise.all([
            User.findById(authorId).populate('friends', '_id'),
            Follow.find({ following: authorId }).populate('follower', '_id')
        ]);


        const friends = authorData.friends.map(friend => friend._id.toString());


        const followers = followData.map(follow => follow.follower._id.toString());


        const recipientIds = [...new Set([...friends, ...followers])];

        const notifications = await Notification.createNewPostNotifications(
            postId,
            authorId,
            recipientIds
        )
        return {
            success: true,
            message: "Thông báo bài viết mới đã được tạo.",
            notifications,
        };
    } catch (error) {
        return {
            success: false,
            message: "Lỗi server: " + error.message,
        };
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu dữ liệu"
            });
        }
        const notifi = await Notification.deleteOne({ _id: id })
        if (notifi.deletedCount === 1) {
            return res.status(200).json({
                success: true,
                message: "Xóa thông báo thành công",

            });
        } else {
            return res.status(400).json({
                success: true,
                message: "Không tìm thấy thông báo cần xóa"
            });
        }


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message
        });
    }
}

export const adminNotification = async (data) => {
    try {

        const { recipient, entityType, entityId, reason, action } = data;

        // Tạo thông báo admin
        const notification = await NotificationModel.createAdminNotification({
            recipient,
            entityType,
            entityId,
            reason,
            action
        });


        return {
            success: true,
            message: "Thông báo admin đã được tạo thành công",
            notification
        };
    } catch (error) {
        return {
            success: false,
            message: "Lỗi server: " + error.message,
        };

    }
}


