
import jwt from 'jsonwebtoken';
import User from '../models/user.modal.js';
import Admin from "../models/admin.modal.js";

export const verifyToken = async (req, res, next) => {
    try {



        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token không tồn tại"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);


            const user = await User.findOne({ email: decoded.email })
                .select('-password -refreshToken');

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "User không tồn tại"
                });
            }


            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token đã hết hạn",
                    expired: true
                });
            }
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ"
            });
        }
    } catch (error) {
        console.error('Error in verifyToken middleware:', error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};


export const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.access_token_admin;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token không tồn tại"
            });
        }



        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);


            const admin = await Admin.findById(decoded.id)
                .select('-password');

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: "Admin không tồn tại"
                });
            }

            req.admin = admin;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token đã hết hạn",
                    expired: true
                });
            }
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ"
            });
        }
    } catch (error) {
        console.error('Error in verifyAdmin middleware:', error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};