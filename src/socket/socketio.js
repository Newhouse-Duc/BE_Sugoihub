import { Server } from "socket.io";
import { saveMessage, updateConversation, updatemembers, readMessage } from "../controllers/chat.controller.js"
import { newPostNotification, newNotification, adminNotification } from "../controllers/notification.controller.js"
let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONT_END_URL,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"]
        }
    });
    let onlineUsers = new Map();

    io.on("connection", (socket) => {
        try {
            console.log("User connected:", socket.id);
            socket.on("joinRoom", (roomId) => {
                socket.join(roomId);
                console.log(`User ${socket.id} joined room ${roomId}`);
            });

            socket.on("addmembers", async (data) => {

                console.log("Có data: ", data);
                try {
                    const newmember = await updatemembers(data)
                    io.emit("updatemember", newmember);

                } catch (error) {
                    console.error("Lỗi lưu nhé  ", error.message);
                    socket.emit("messageError", {
                        message: "Không thể gửi tin nhắn",
                        error: error.message
                    });
                }

            });

            socket.on("deletemember", async (data) => {
                try {
                    const newmember = await updatemembers(data)
                    io.emit("afterdeletemember", newmember);

                } catch (error) {
                    console.error("Lỗi lưu nhé xóa  ", error.message);
                    socket.emit("messageError", {
                        message: "Không thể gửi tin nhắn",
                        error: error.message
                    });
                }
                console.log("Có data xóa: ", data);
                io.emit("updatemember", data);
            });
            socket.on("updategroupchat", async (data) => {


                console.log("Có data mới của groiup chát: ", data);

                try {
                    const newdata = await updateConversation(data)
                    console.log("Có data trả về  ", newdata);
                    io.emit("newinforgroupchat", data);
                } catch (error) {
                    console.error("Lỗi lưu nhé  ", error.message);

                    socket.emit("messageError", {
                        message: "Không thể gửi tin nhắn",
                        error: error.message
                    });
                }




            });
            socket.on("userOnline", ({ userId, role }) => {
                console.log("User/Admin Online:", userId, role);
                onlineUsers[userId] = { socketId: socket.id, role };


                const usersWithRoleUser = Object.keys(onlineUsers).filter(
                    (id) => onlineUsers[id].role === "user"
                );

                console.log("Filtered online users (role=user):", usersWithRoleUser);


                io.emit("updateOnlineUsers", usersWithRoleUser);
            });


            socket.on("adminNotification", (data) => {
                try {


                } catch (error) {
                    console.error("Lỗi xử lý sự kiện tạo thông báo mới từ admin", error.message);
                }
            })
            socket.on("likepost", async (data) => {
                try {
                    console.log("xem data nào ", onlineUsers)
                    const result = await newNotification(data)
                    const notification = result.notification;
                    const recipient = result.notification.recipient;
                    const recipientId = recipient.toString();

                    // Kiểm tra trực tiếp từ object
                    if (onlineUsers[recipientId]) {
                        console.log("hãy vui lên nào hòa nhọp ca vang");
                        const recipientInfo = onlineUsers[recipientId];
                        console.log("xem nhận đi ", notification)
                        io.to(recipientInfo.socketId).emit("notifilikepost", notification);
                    } else {
                        console.log("Người dùng không online:", recipient);
                    }

                } catch (error) {
                    console.error("Lỗi xử lý sự kiện like post", error.message);
                }
            });


            socket.on("commentpost", async (data) => {

                try {
                    const result = await newNotification(data)
                    const notification = result.notification;
                    const recipient = result.notification.recipient


                    if (onlineUsers.has(recipient.toString())) {
                        const recipientSocketId = onlineUsers.get(recipient.toString());

                        io.to(recipientSocketId).emit("notificommentpost", notification);
                    }

                } catch (error) {
                    console.error("Lỗi xử lý sự kiện bình luận bài viết", error.message);
                }
            });

            socket.on("replycomment", async (data) => {
                console.log("nhận ra : ", data)
                try {
                    const result = await newNotification(data)
                    const notification = result.notification;
                    const recipient = result.notification.recipient


                    if (onlineUsers.has(recipient.toString())) {
                        const recipientSocketId = onlineUsers.get(recipient.toString());

                        io.to(recipientSocketId).emit("notifireplycomment", notification);
                    }

                } catch (error) {
                    console.error("Lỗi xử lý sự kiện bình luận bài viết", error.message);
                }
            });

            socket.on("newpost", async (data) => {
                try {

                    const result = await newPostNotification(data);
                    console.log("Thông báo bài viết mới đã được tạo:", result);


                    const notifications = result.notifications;

                    if (notifications && notifications.length > 0) {
                        console.log("Thông báo bài viết mới đã được tạo:", notifications);

                        notifications.forEach((notification) => {
                            const recipientId = notification.recipient;

                            if (onlineUsers.has(recipientId.toString())) {
                                const recipientSocketId = onlineUsers.get(recipientId.toString());

                                io.to(recipientSocketId).emit("notifipost", notification);
                            }
                        });
                    } else {
                        console.error("Không có thông báo nào được tạo.");
                    }
                } catch (error) {
                    console.error("Lỗi xử lý sự kiện newpost:", error.message);
                }
            });

            socket.on("sendMessage", async (data) => {
                console.log("Message received:", data);

                try {
                    const savedMessage = await saveMessage(data);
                    console.log("Message gửi đi ", savedMessage);
                    io.to(data.roomId).emit("receiveMessage", savedMessage);
                } catch (error) {
                    console.error("Lỗi lưu tin nhắn ", error.message);

                    socket.emit("messageError", {
                        message: "Không thể gửi tin nhắn",
                        error: error.message
                    });
                }
            });
            socket.on("messageRead", async (data) => {
                console.log("Message read:", data);

                try {
                    const updatedMessage = await readMessage(data);
                    io.to(data.roomId).emit("messageRead", updatedMessage);
                } catch (error) {
                    console.error("Lỗi lưu tin nhắn ", error.message);

                    socket.emit("messageError", {
                        message: "Không thể gửi tin nhắn",
                        error: error.message
                    });
                }
            });

            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id);


                for (let [userId, id] of onlineUsers.entries()) {
                    if (id === socket.id) {
                        onlineUsers.delete(userId);
                        break;
                    }
                }
                io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
            });
        } catch (error) {
            console.error("Socket.IO Error:", error.message);
        }
    });


    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO chưa được khởi tạo!");
    }
    return io;
};