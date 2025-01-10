import express from 'express'
import { sendOtpemail, register, login, verifyOtp, refreshtokenUser, logout, getUserProfile }
    from '../controllers/auth.controller.js'

import { getAllPostUser, createPost, deletePost, getMyPost, getPostbyUser, likePost, uploadVideoPost, updatePost }
    from '../controllers/post.controller.js';

import { updateProfile, getUser, getProfileUserbyId, changePassWord, resetPasswordOtp, verifyOtpResetPassword, resetPassword, listFriend }
    from '../controllers/account.controller.js';

import { verifyToken }
    from '../middleware/authMidleware.js';

import { addfriend, getfriendship, updateFriendship, deleteFriend }
    from '../controllers/friendship.controller.js';

import { follower }
    from '../controllers/follower.controller.js';

import { getChat, getMessage, uploadImagechat, createConservation, uploadVoicecloud }
    from '../controllers/chat.controller.js';

import { comment, getCommentByPost, replyComment, deleteComment, likeComment, getReplyComment }
    from '../controllers/comment.controller.js';
import { getAllNotification, newPostNotification, deleteNotification, isReadNotification }
    from '../controllers/notification.controller.js';
import uploadmulter from '../config/multer.js';

const router = express.Router();
/**
 * 
 * @param {*} app : express app
 */

const userRouter = (app) => {


    router.post("/auth/sendotp", sendOtpemail)
    //auth
    router.post("/auth/register", register)
    router.post("/auth/login", login)
    router.post("/auth/verifyotp", verifyOtp)
    router.get('/auth/profile', verifyToken, getUserProfile)
    router.post("/auth/refresh", refreshtokenUser)
    router.post("/auth/logout", logout)


    // account 
    router.put("/account/update", uploadmulter.array('avatar', 1), verifyToken, updateProfile)
    router.patch("/account/password", verifyToken, changePassWord)
    router.post("/account/password/reset/sentotp", resetPasswordOtp)
    router.post("/account/password/verify", verifyOtpResetPassword)
    router.put("/account/password/reset", resetPassword)

    //post
    router.get("/post/all/:id", getAllPostUser)
    router.post("/post/create", uploadmulter.fields([
        { name: 'images', maxCount: 3 },
        { name: 'videos', maxCount: 3 }
    ]), createPost);

    router.put("/post/:id", uploadmulter.fields([
        { name: 'images', maxCount: 3 },
        { name: 'videos', maxCount: 3 }
    ]), updatePost);

    router.delete("/post/delete/:id", deletePost)
    router.get("/post/user/:id", getMyPost)
    router.get("/post/guest/allpost/:id/:userid", getPostbyUser)
    router.post("/post/like", likePost)
    router.post("/post/video", uploadmulter.array('files'), uploadVideoPost)

    // notification
    router.get("/notification/getAll", verifyToken, getAllNotification)
    router.post("/notification/new/post", newPostNotification)
    router.delete("/notification/delete/:id", deleteNotification)
    router.patch('/notification/mask-read', isReadNotification)

    // list user
    router.get("/auth/getuser", getUser)
    router.get("/auth/:id/friend", listFriend)
    router.get("/user/:id", getProfileUserbyId)


    // friend
    router.get("/friend/friendship/:id", getfriendship)
    router.post("/friend/addfriend", addfriend)
    router.put("/friend/updatefriend", updateFriendship)
    router.delete("/friend/remove", deleteFriend)


    // follow 
    router.post("/follow", follower)


    //chats
    router.get("/chat/listchat", verifyToken, getChat)
    router.get("/chat/user/:conversationId", verifyToken, getMessage)
    router.post("/chat/upload/image", uploadmulter.array('images', 3), uploadImagechat)
    router.post("/chat/conversation", uploadmulter.array('avatar', 1), createConservation)
    router.post("/chat/voice", uploadmulter.single('file'), uploadVoicecloud)


    // comment 
    router.post("/comment/post", uploadmulter.array('images', 3), comment)
    router.get("/comment/post/allcomment/:id", verifyToken, getCommentByPost)
    router.get("/comment/post/replycomment/:id", verifyToken, getReplyComment)
    router.post("/comment/reply", uploadmulter.array('images', 3), replyComment)
    router.delete("/comment/:id", deleteComment)
    router.post("/comment/like", likeComment)


    return app.use("/api/v1/", router);



}

export default userRouter;
