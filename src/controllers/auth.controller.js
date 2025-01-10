import express from "express";
import sendOTP from "../utils/sendOtp.js";
import User from '../models/user.modal.js';
import Otp from "../models/otp.modal.js";
import Admin from "../models/admin.modal.js";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const generatejwttoken = (user) => {
    const payload = {
        email: user.email,
        username: user.username
    }
    const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {
        expiresIn: process.env.JWT_EXPIRE_REFRESH
    });

    return { access_token, refreshToken };

}


const setRefreshTokenCookie = (res, access_token, refreshToken) => {

    res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 1000,
        path: '/api'
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api'
    });
};

export const sendOtpemail = async (req, res) => {
    const { email } = req.body;
    try {

        if (!email) {
            return res.status(400).json({ message: 'Thiếu Email' });
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email không hợp lệ' });
        }

        await sendOTP(email, 'verifyEmail');
        return res.status(200).json({
            success: true,
            message: 'Mã OTP đã được gửi hãy kiểm tra Email của bạn!'
        });
    } catch (error) {
        console.error('Lỗi gửi OTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Gửi mã OTP thất bai vui lòng thử lại saui',
            error: error.message
        });
    }
}


export const register = async (req, res) => {
    try {
        const { username, email, password, birthDate } = req.body;
        const exstinguser = await User.findOne({ email });
        if (exstinguser) {
            return res.status(401).json({ message: "Email đã được sử dụng." });
        }
        const newUser = new User({
            username,
            email,
            password,
            birthDate,
        });
        await Promise.all(
            [
                await newUser.save(),
                await sendOTP(email, 'register'),
            ]
        )

        return res.status(201).json({
            success: true,
            message: "Đăng ký thành công.",
            user: newUser
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Có lỗi xảy ra khi đăng ký tài khoản",
        });
    }
}


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({
                success: false,
                message: "Thông tin đăng nhập không chính xác",
            });
        }
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Vui lòng xác thực tài khoản",
                data: {
                    verify: false,
                    email,
                },
            });
        }
        if (user.ban) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản của bạn đã bị khóa do vi phạm chính sách ",

            });
        }


        const { access_token, refreshToken } = generatejwttoken(user)
        user.refreshToken = refreshToken;
        await user.save();

        setRefreshTokenCookie(res, access_token, refreshToken);
        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công.",

            data: user,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Có lỗi xảy ra khi đăng nhập tài khoản",
        });
    }
}


export const refreshtokenUser = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token không tồn tại"
            });
        }


        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);


        const user = await User.findOne({
            email: decoded.email,
            refreshToken: refreshToken
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Refresh token không hợp lệ"
            });
        }


        const { access_token, refreshToken: newRefreshToken } = generatejwttoken(user);


        user.refreshToken = newRefreshToken;
        await user.save();


        setRefreshTokenCookie(res, access_token, newRefreshToken);

        return res.status(200).json({
            success: true,
            message: "RefreshToken thành công"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Refresh token không hợp lệ"
        });
    }
};



export const getUserProfile = async (req, res) => {
    try {

        console.log(req.user._id)
        const userDetails = await User.findById(req.user._id).select(
            "-password -refreshToken -__v"
        );
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "Vui lòng đăng nhập",
            });
        }

        return res.status(200).json({
            success: true,
            data: userDetails,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            data: {},
            message: "Lỗi server: " + error.message,
        });

    }

}

export const verifyOtp = async (req, res) => {
    try {

        const { email, otp } = req.body;
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mã OTP",
            });
        }
        const otpcode = await Otp.findOne({ email, otp })
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

        await Promise.all([
            otpcode.deleteOne(),
            await User.findOneAndUpdate({ email }, { isActive: true })

        ]
        )
        return res.status(200).json({
            success: true,
            message: 'Xác thực thành công'
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        })
    }
}



export const logout = async (req, res) => {
    try {

        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await User.findOneAndUpdate(
                { refreshToken },
                { $set: { refreshToken: null } }
            );
        }

        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/api'
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api'
        });

        return res.status(200).json({
            success: true,
            message: "Đăng xuất thành công"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server: " + error.message,
        });
    }
};