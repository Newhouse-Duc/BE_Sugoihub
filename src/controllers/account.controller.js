
import User from '../models/user.modal.js';
import Otp from "../models/otp.modal.js";
import { uploadImage, deleteImage } from '../uploadServices/uploadService.js';
import sendOTP from '../utils/sendOtp.js';
import bcrypt from 'bcryptjs';

export const updateProfile = async (req, res) => {
    try {
        console.log("xem thử ", req.body)
        const { username, bio, birthDate, removeAvatar } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Người dùng không tồn tại"
            });
        }

        if (removeAvatar) {

            await Promise.all([
                deleteImage(removeAvatar),
                User.updateOne({ _id: user._id }, { $unset: { "avatar.url": "", "avatar.publicId": "" } })
            ]);
        }




        let avatar = null;

        console.log("xem ảnh : ", req.files)
        if (req.files && req.files.length > 0) {
            const uploadedAvatars = await uploadImage(req.files);
            if (uploadedAvatars.length > 0) {
                avatar = uploadedAvatars[0];
            }
        }
        if (username) user.username = username;
        if (bio) user.bio = bio;
        if (birthDate) user.birthDate = birthDate;
        if (avatar) user.avatar = avatar;


        console.log("avatar mới: ", avatar);
        const updatedUser = await user.save();
        const userObject = updatedUser.toObject();
        delete userObject.password;
        delete userObject.refreshToken;
        console.log("xem hết  : ", userObject)
        return res.status(200).json({
            success: true,
            message: "Cập nhật thành công!",
            data: userObject
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
}


export const getUser = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 1;


        const skip = (page - 1) * limit;


        const listUser = await User.find({ isActive: true, ban: false }, "_id username avatar")
            .skip(skip)
            .limit(limit);


        const totalUsers = await User.countDocuments();

        if (!listUser || listUser.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có người dùng nào"
            });
        }

        return res.status(200).json({
            success: true,
            data: listUser,
            totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
}

export const listFriend = async (req, res) => {
    try {
        const { id } = req.params;


        const user = await User.findById(id).populate('friends', 'username avatar');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Người dùng không tồn tại"
            });
        }


        const friendsList = user.friends;


        if (!friendsList || friendsList.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Người dùng không có bạn bè",
                data: []
            });
        }


        return res.status(200).json({
            success: true,
            data: friendsList
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
}





export const getProfileUserbyId = async (req, res) => {
    try {

        const { id } = req.params;
        const userbyid = await User.findById(id).select(
            "-password -refreshToken -__v"
        );

        if (!userbyid) {
            return res.status(404).json({
                success: false,
                message: "không có người dùng mà bạn cần tìm ",
            });
        }

        return res.status(200).json({
            success: true,
            message: "lấy thông tin thành công ",
            data: userbyid


        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
}


export const changePassWord = async (req, res) => {
    try {
        const { oldpassword, newpassword } = req.body;
        console.log("req body: ", req.body)
        if (!oldpassword || !newpassword) {
            return res.status(400).json({
                success: false,
                message: "Hãy điền đủ thông tin ",
            });
        }


        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Người dùng không tồn tại",
            });
        }


        const isMatch = await bcrypt.compare(oldpassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu cũ không đúng',
            });
        }
        if (oldpassword === newpassword) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu mới phải khác mật khẩu cũ",
            });
        }



        const hashedPassword = await bcrypt.hash(newpassword, 10);

        await User.findOneAndUpdate(
            { _id: req.user._id },
            { password: hashedPassword },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};

export const resetPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        await sendOTP(email, 'resetPassword');

        res.status(200).json({
            success: true,
            message: 'OTP đặt lại mật khẩu đã được gửi đến email của bạn'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
};
export const verifyOtpResetPassword = async (req, res) => {
    try {

        const { email, otp } = req.body;
        console.log(req.body)
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mã OTP",
            });
        }
        const otpcode = await Otp.findOne({ email, otp, action: 'resetPassword' })
        if (!otpcode) {
            return res.status(400).json({
                success: false,
                message: "Sai mã OTP"
            });
        }
        if (otpcode && otpcode.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Mã OTP hết hạn"
            })
        };

        return res.status(200).json({
            success: true,
            message: 'Xác thực thành công'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
}


export const resetPassword = async (req, res) => {
    try {
        const { email, newpassword } = req.body
        console.log(email,)
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Không có email xác thực "
            })
        }
        if (!newpassword) {
            return res.status(400).json({
                success: false,
                message: "Hãy nhập mật khẩu mới "
            })
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Không tìm thấy tài khoản cần đổi mật khẩu vui lòng quay lại trang đăng nhập",
            });
        }
        const hashedPassword = await bcrypt.hash(newpassword, 10);

        await User.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        );
        return res.status(200).json({
            success: true,
            message: 'Reset mật khẩu thành công hãy đăng nhập'
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
}
