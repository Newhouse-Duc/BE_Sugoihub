import Friendship from "../models/friendship.modal.js";
import User from "../models/user.modal.js"
import Conversation from "../models/conversation.modal.js";


export const addfriend = async (req, res) => {
    try {

        const { requesterId, receiverId } = req.body;


        if (!requesterId || !receiverId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết: requesterId hoặc receiverId.",
            });
        }


        if (requesterId === receiverId) {
            return res.status(400).json({
                success: false,
                message: "Không thể gửi lời mời kết bạn tới chính mình.",
            });
        }


        const existingFriendship = await Friendship.findOne({
            requesterId,
            receiverId,
            status: "pending"
        });


        if (existingFriendship) {

            await Friendship.deleteOne({ _id: existingFriendship._id });

            return res.status(200).json({
                success: true,
                message: "Đã hủy lời mời kết bạn.",
            });
        }


        const newFriendship = await Friendship.create({
            requesterId,
            receiverId,
            status: "pending",
        });

        return res.status(200).json({
            success: true,
            message: "Đã gửi lời mời kết bạn.",
            data: newFriendship,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
}


export const getfriendship = async (req, res) => {
    try {

        const { id } = req.params;
        const sentRequests = await Friendship.find({
            requesterId: id,
            status: "pending"
        });

        const receivedRequests = await Friendship.find({
            receiverId: id,
            status: "pending",
        }).populate('requesterId', 'avatar username');

        return res.status(200).json({
            success: true,
            message: "Danh sách lời mời kết bạn.",
            data: {
                sentRequests,
                receivedRequests,
            },
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
}


export const updateFriendship = async (req, res) => {
    try {

        const { requesterId, receiverId, status } = req.body;

        if (!requesterId || !receiverId || !status) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết:",
            });
        }
        const validStatuses = ["accepted", "rejected"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ. Chỉ chấp nhận: 'accepted', 'rejected'.",
            });
        }


        const friendship = await Friendship.findOneAndUpdate(
            { requesterId, receiverId, status: "pending" },
            { status },
            { new: true }
        );

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lời mời kết bạn ",
            });
        }


        if (status === "accepted") {
            await Promise.all([
                User.updateOne(
                    { _id: requesterId },
                    { $addToSet: { friends: receiverId } }
                ),
                User.updateOne(
                    { _id: receiverId },
                    { $addToSet: { friends: requesterId } }
                )
            ]);
            const existingConversation = await Conversation.findOne({
                isGroup: false,
                participants: { $all: [requesterId, receiverId] },
            });

            if (!existingConversation) {
                await Conversation.create({
                    participants: [requesterId, receiverId],
                    isGroup: false,
                });
            }
        }


        return res.status(200).json({
            success: true,
            message: status === "accepted" ? "Kết bạn thành công!" : "Từ chối kết bạn.",
            data: friendship,
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
}


export const deleteFriend = async (req, res) => {
    try {

        const { userId, friendId } = req.body;

        if (!userId || !friendId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết",
            });
        }

        if (userId === friendId) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa chính mình khỏi danh sách bạn bè.",
            });
        }


        const friendship = await Friendship.findOneAndDelete({
            $or: [
                { requesterId: userId, receiverId: friendId },
                { requesterId: friendId, receiverId: userId }
            ]
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy mối quan hệ bạn bè.",
            });
        }


        await Promise.all([
            User.updateOne({ _id: userId }, { $pull: { friends: friendId } }),
            User.updateOne({ _id: friendId }, { $pull: { friends: userId } })
        ]);

        return res.status(200).json({
            success: true,
            message: "Đã xóa bạn bè thành công.",
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
}


