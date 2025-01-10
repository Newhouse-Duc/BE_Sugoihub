import User from "../models/user.modal.js";
import Follow from "../models/follow.modal.js";

export const follower = async (req, res) => {
    try {

        const { currentIdUser, userFollow } = req.body;


        const currentUser = await User.findById(currentIdUser);
        const userToFollow = await User.findById(userFollow);

        if (!currentUser || !userToFollow) {
            return res.status(404).json({
                success: false,
                message: "Người dùng không tồn tại",
            });
        }


        const existingFollow = await Follow.findOne({
            follower: currentIdUser,
            following: userFollow,
        });
        if (existingFollow) {

            await existingFollow.deleteOne();

            return res.status(200).json({
                success: true,
                message: "Đã hủy theo dõi người dùng này.",
            });
        } else {

            const newFollow = new Follow({
                follower: currentIdUser,
                following: userFollow,
            });

            await newFollow.save();

            return res.status(200).json({
                success: true,
                message: "Đã theo dõi người dùng này.",
            });
        }

    }
    catch (error) {
        return res.status(500).json(
            {
                success: false,
                message: "Lỗi server: " + error.message,
            }
        )
    }
}