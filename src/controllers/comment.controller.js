import Comment from "../models/comment.modal.js";
import { uploadImage, deleteImage } from "../uploadServices/uploadService.js";

import mongoose from 'mongoose';
export const comment = async (req, res) => {
    try {

        const { author, content, postId } = req.body;
        if (!content || !author || !postId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết ",
            });
        }
        let images = [];
        if (req.files && req.files.length > 0) {
            images = await uploadImage(req.files);
        }

        const newComment = new Comment({
            author,
            content,
            postId,
            images,
        });

        await newComment.save();

        return res.status(201).json({
            success: true,
            message: "Đã bình luận bài viết thành công ",
            comment: newComment,
        });

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

export const getCommentByPost = async (req, res) => {
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
        console.log("xem post: ", postId)

        const allComment = await Comment.aggregate([
            {
                $match: {
                    postId: new mongoose.Types.ObjectId(postId),
                    parentId: null
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
                    isLiked: {
                        $cond: {
                            if: { $eq: [{ $type: req.user }, 'missing'] },
                            then: false,
                            else: {
                                $in: [
                                    { $toObjectId: req.user._id.toString() },
                                    '$likes'
                                ]
                            }
                        }
                    }
                }
            },
            {
                // Lấy toàn bộ các phản hồi liên quan
                $graphLookup: {
                    from: "comments",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parentId",
                    as: "allReplies",
                },
            },
            {
                $addFields: {
                    replyCount: { $size: "$allReplies" }, // Tổng số phản hồi
                },
            },
            {
                $project: {
                    content: 1,
                    likesCount: 1,
                    isLiked: 1,
                    authorInfo: 1,
                    parentId: 1,
                    postId: 1,
                    images: 1,
                    createdAt: 1,
                    replyCount: 1,
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

export const getReplyComment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Comment đã bị xóa hoặc không tồn tại"
            });
        }

        const replies = await Comment.aggregate([
            {
                $match: {
                    parentId: new mongoose.Types.ObjectId(id)
                }
            },
            {
                $graphLookup: {
                    from: "comments",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parentId",
                    as: "childReplies"
                }
            },
            {
                $addFields: {
                    allComments: {
                        $concatArrays: [["$$ROOT"], "$childReplies"]
                    }
                }
            },
            {
                $unwind: "$allComments"
            },
            // Thêm stage để đếm số lượng replies cho mỗi comment
            {
                $lookup: {
                    from: "comments",
                    let: { commentId: "$allComments._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$parentId", "$$commentId"]
                                }
                            }
                        },
                        {
                            $count: "replyCount"
                        }
                    ],
                    as: "replyCountInfo"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "allComments.author",
                    foreignField: "_id",
                    as: "authorInfo"
                }
            },
            {
                $unwind: "$authorInfo"
            },
            {
                $addFields: {
                    "allComments.likesCount": { $size: "$allComments.likes" },
                    "allComments.replyCount": {
                        $ifNull: [{ $arrayElemAt: ["$replyCountInfo.replyCount", 0] }, 0]
                    },
                    "allComments.isLiked": {
                        $cond: {
                            if: { $eq: [{ $type: req.user }, 'missing'] },
                            then: false,
                            else: {
                                $in: [
                                    { $toObjectId: req.user._id.toString() },
                                    "$allComments.likes"
                                ]
                            }
                        }
                    },
                    "allComments.author": {
                        _id: "$authorInfo._id",
                        username: "$authorInfo.username",
                        avatar: "$authorInfo.avatar"
                    }
                }
            },
            {
                $replaceRoot: { newRoot: "$allComments" }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    parentId: 1,
                    postId: 1,
                    createdAt: 1,
                    likesCount: 1,
                    replyCount: 1,
                    isLiked: 1,
                    images: 1,
                    author: 1,
                    allComments: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        if (replies.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Chưa có phản hồi nào",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tất cả phản hồi bình luận của bài viết",
            data: replies
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message
        });
    }
};


export const replyComment = async (req, res) => {
    try {
        const { author, content, postId, parentId } = req.body;
        if (!content || !author || !postId || !parentId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết ",
            });
        }
        let images = [];
        if (req.files && req.files.length > 0) {
            images = await uploadImage(req.files);
        }

        const newComment = new Comment({
            author,
            content,
            postId,
            images,
            parentId
        });

        await newComment.save();

        return res.status(201).json({
            success: true,
            message: "Đã bình luận bài viết thành công ",
            comment: newComment,
        });
    } catch (error) {
        return res.status(500).json(
            {
                success: false,
                message: "Lỗi server: " + error.message
            }
        )
    }
}


export const likeComment = async (req, res) => {
    try {
        const { userId, commentId } = req.body;

        if (!userId || !commentId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu id hoặc postId"
            });
        }

        const comment = await Comment.findById(commentId)

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài viết"
            });
        }


        const existingLikeIndex = comment.likes.findIndex(
            likeId => likeId.toString() === userId
        );

        if (existingLikeIndex !== -1) {
            comment.likes.splice(existingLikeIndex, 1);
            await comment.save();

            return res.status(200).json({
                success: true,
                message: "Bỏ thích bài viết thành công",
                data:
                {
                    likesCount: comment.likes.length,
                    isLiked: false,
                    commentId: comment._id,
                }
            });
        } else {
            comment.likes.push(userId);
            await comment.save();

            return res.status(200).json({
                success: true,
                message: "Thích bài viết thành công",
                data:
                {
                    likesCount: comment.likes.length,
                    isLiked: true,
                    commentId: comment._id,
                }
            });
        }

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message
        });
    }
}

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;


        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết",
            });
        }


        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Bình luận không tồn tại",
            });
        }



        const deleteCommentRecursively = async (commentId) => {

            const childComments = await Comment.find({ parentId: commentId });


            for (const childComment of childComments) {

                if (childComment.images && childComment.images.length > 0) {
                    const deleteImagePromises = childComment.images.map(async (image) => {
                        if (image.publicId) {
                            await deleteImage(image.publicId);
                        }
                    });
                    await Promise.all(deleteImagePromises);
                }


                await deleteCommentRecursively(childComment._id);
            }

            await Comment.deleteOne({ _id: commentId });
        };


        if (comment.images && comment.images.length > 0) {
            const deleteImagePromises = comment.images.map(async (image) => {
                if (image.publicId) {
                    await deleteImage(image.publicId);
                }
            });
            await Promise.all(deleteImagePromises);
        }


        await deleteCommentRecursively(id);

        return res.status(200).json({
            success: true,
            message: "Đã xóa bình luận thành công",
        });
    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};


