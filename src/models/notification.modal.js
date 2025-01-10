
import mongoose from "mongoose";


export const NotificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: [

                'POST_LIKE',
                'NEW_POST',
                'POST_BLOCKED',
                'POST_COMMENT',
                'COMMENT_REPLY',
                'COMMENT_LIKE',
                'FRIEND_REQUEST',
                'FRIEND_ACCEPT',
                'ADMIN_NOTIFICATION'
            ],
            required: true
        },

        // Đối tượng liên quan
        entity: {
            // Loại đối tượng
            type: {
                type: String,
                enum: ['POST', 'COMMENT', 'USER', 'SYSTEM'],
                required: true
            },
            // ID của đối tượng
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            // Dữ liệu bổ sung của đối tượng (ví dụ: nội dung comment, lý do xóa post)
            data: {
                type: mongoose.Schema.Types.Mixed
            }
        },

        text: {
            type: String,
            required: true
        },

        // Link khi click vào thông báo
        link: String,

        // Mức độ ưu tiên
        priority: {
            type: String,
            enum: ['LOW', 'NORMAL', 'HIGH'],
            default: 'NORMAL'
        },

        // Trạng thái đã đọc
        isRead: {
            type: Boolean,
            default: false
        },

        // Trạng thái active
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);


NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
NotificationSchema.statics = {
    // Tạo thông báo tương tác
    async createInteractionNotification({
        type, recipient, sender, entityType, entityId, entityData = null, text, link
    }) {
        return this.create({
            type,
            recipient,
            sender,
            entity: {
                type: entityType,
                id: entityId,
                data: entityData
            },
            text,
            link,
            priority: 'NORMAL'
        });
    },

    // Tạo thông báo từ admin
    async createAdminNotification({
        recipient, entityType, entityId, reason, action
    }) {
        return this.create({
            type: 'ADMIN_NOTIFICATION',
            recipient,
            entity: {
                type: entityType,
                id: entityId,
                data: { reason, action }
            },
            text: `Bài viết của bạn đã bị ${action} vì ${reason}`,
            priority: 'HIGH',
            isRead: false
        });
    },

    // Tạo thông báo bài viết mới cho nhiều người
    async createNewPostNotifications(postId, authorId, recipientIds) {
        const notifications = recipientIds.map(recipientId => ({
            type: 'NEW_POST',
            recipient: recipientId,
            sender: authorId,
            entity: {
                type: 'POST',
                id: postId
            },
            text: 'đã đăng một bài viết mới',
            priority: 'LOW'
        }));

        return this.insertMany(notifications);
    },

    // Lấy thông báo của user
    async getNotifications(userId, options = {}) {
        const query = {
            recipient: userId,
            isActive: true,
            ...(options.unreadOnly ? { isRead: false } : {})
        };

        return this.find(query)
            .sort({ createdAt: -1 })
            .limit(options.limit || 5)
            .skip(options.skip || 0)
            .populate('sender', 'username avatar')
            .lean();
    },

    // Đếm thông báo chưa đọc
    async countUnread(userId) {
        return this.countDocuments({
            recipient: userId,
            isRead: false,
            isActive: true
        });
    }
};
const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
