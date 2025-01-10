import Conversation from "../models/conversation.modal.js";

import Message from "../models/message.modal.js";

import User from '../models/user.modal.js';

import { uploadImage, deleteImage, uploadVoice, uploadVideo } from '../uploadServices/uploadService.js';

export const getChat = async (req, res) => {
    try {
        const userId = req.user.id;


        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate({
                path: "participants",
                select: "username avatar",
            })
            .populate({
                path: 'lastMessage',
                select: 'content sender createdAt',
                populate: {
                    path: 'sender',
                    select: 'username ',
                },
            })
            .sort({ updatedAt: -1 });


        const formattedConversations = conversations.map((conversation) => {
            if (conversation.isGroup) {

                return {
                    conversationId: conversation._id,
                    isGroup: true,
                    admin: conversation.admin,
                    name: conversation.groupName,
                    avatar: conversation.avatar,
                    participants: conversation.participants,
                    lastMessage: conversation.lastMessage,
                    updatedAt: conversation.updatedAt,
                };
            } else {

                const friend = conversation.participants.find(
                    (participant) => participant._id.toString() !== userId
                );

                return {
                    conversationId: conversation._id,
                    isGroup: false,
                    friend: friend,
                    lastMessage: conversation.lastMessage,
                    updatedAt: conversation.updatedAt,
                };
            }
        });

        return res.status(200).json({
            success: true,
            data: formattedConversations,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error: " + error.message,
        });
    }
}

export const createConservation = async (req, res) => {
    try {
        const { groupName, admin, isGroup } = req.body;

        const members = JSON.parse(req.body.members);
        if (!groupName || !admin || !isGroup || !members) {
            return res.status(400).json({
                success: false,
                message: " Thiếu thông tin cần thiết"
            });
        }

        let avatar = null;
        if (req.files && req.files.length > 0) {
            const uploadedAvatars = await uploadImage(req.files);
            if (uploadedAvatars.length > 0) {
                avatar = uploadedAvatars[0];
            }
        }
        const newConversation = new Conversation({
            participants: members,
            isGroup,
            groupName,
            admin,
            avatar,
        });
        await newConversation.save()

        return res.status(200).json({
            success: true,
            message: "Tạo nhóm thành công",
            data: newConversation,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error: " + error.message,
        });
    }
}

export const getMessage = async (req, res) => {
    try {

        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json(
                {
                    success: false,
                    message: "Thiếu mã trò chuyện"
                }
            )
        }

        const messageChat = await Message.find({ conversationId: conversationId }).sort({ createdAt: 1 }).populate({
            path: 'sender',
            select: 'username avatar',
        });

        if (!messageChat || messageChat.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Chưa có tin nhắn nào ",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tin nhắn trong cuộc trò chuyện đã được lấy thành công",
            data: messageChat
        });



    } catch (error) {
        return res.status(500).json(
            {
                success: false,
                message: " lỗi server: " + error.message
            }
        )
    }
}

export const uploadImagechat = async (req, res) => {
    try {

        if (!req.files || req.files.length === 0) {
            throw new Error('Không có file nào được upload.');
        }
        const image = await uploadImage(req.files)
        return res.status(200).json({
            success: true,
            message: 'Upload thành công!',
            data: image,
        });

    } catch (error) {
        return res.status(500).json(
            {
                success: false,
                message: " lỗi server: " + error.message
            }
        )
    }
}

export const saveMessage = async (data) => {
    try {
        const { conversationId, sender, content, images, voices } = data;

        if (!conversationId || !sender) {
            throw new Error("Thiếu thông tin cần thiết!");
        }
        if (!content && !images && !voices) {
            throw new Error("Thiếu dữ liệu tin nhắn! Cần ít nhất một trong các trường content, images hoặc voices.");
        }

        const newMessage = new Message({
            conversationId,
            sender,
            content,
            images,
            voices
        });

        const savedMessage = await newMessage.save();


        await Conversation.findByIdAndUpdate(
            conversationId,
            { lastMessage: savedMessage._id },
            { new: true }
        );


        return await Message.findById(savedMessage._id).populate({
            path: 'sender',
            select: 'username avatar',
        });

    } catch (error) {
        throw new Error("Lỗi server: " + error.message);
    }
};
export const readMessage = async (data) => {
    try {
        const { messageId, seenBy, status } = data;

        if (!messageId || !seenBy || !status) {
            throw new Error("Thiếu thông tin cần thiết!");
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            { _id: messageId },
            {
                $addToSet: { seenBy: seenBy },
                status: status
            },
            { new: true }
        ).populate({
            path: 'sender',
            select: 'username avatar'
        });

        return updatedMessage;
    } catch (error) {
        throw new Error("Lỗi server: " + error.message);
    }
};



export const updateConversation = async (data) => {
    try {
        const { conversationId, admin, groupName, avatar, avatardelete } = data;
        if (!conversationId || !groupName) {
            throw new Error("Thiếu thông tin cần thiết!");
        }

        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
            return { message: "Không tìm thấy cuộc trò chuyện" }
        }

        if (avatardelete) {
            await deleteImage(avatardelete)
            conversation.avatar = null;
        }

        if (avatar) conversation.avatar = avatar[0]
        if (admin) conversation.admin = admin
        if (groupName) conversation.groupName = groupName

        const updatedUser = await conversation.save();
        return {
            message: "Thay đổi thành công",
            updatedUser
        }



    } catch (error) {
        throw new Error("Lỗi server: " + error.message);
    }
}

export const updatemembers = async (data) => {
    try {
        const { conversationId, members, deletemember } = data
        if (!conversationId) {
            throw new Error("Thiếu thông tin cần thiết!");
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return { message: "Không tìm thấy cuộc trò chuyện" };
        }

        const updatemember = {};
        if (members && members.length > 0) {
            updatemember.$addToSet = { participants: { $each: members } };
        }

        if (deletemember) {
            updatemember.$pull = { participants: deletemember };
        }
        const updatedConversation = await Conversation.findByIdAndUpdate(
            conversationId,
            updatemember,
            { new: true }
        );

        if (!updatedConversation) {
            return { message: "Không tìm thấy cuộc trò chuyện sau khi cập nhật" };
        }

        return {
            message: "Cập nhật thành công",
            updatedConversation
        };



    } catch (error) {
        throw new Error("Lỗi server: " + error.message);
    }
}


export const uploadVoicecloud = async (req, res) => {
    try {
        if (!req.file || req.file.length === 0) {
            throw new Error('Không có file nào được upload.');
        }
        const voice = await uploadVoice(req.file)
        return res.status(200).json({
            success: true,
            message: 'Upload thành công!',
            data: voice,
        });



    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "lỗi server"
        })
    }
}

