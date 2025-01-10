
import User from '../models/user.modal.js';
import Otp from "../models/otp.modal.js";
import Admin from "../models/admin.modal.js";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const generatejwttokenAdmin = (admin) => {
    const payload = {
        username: admin.username,
        id: admin._id
    }
    const access_token_admin = jwt.sign(payload, process.env.JWT_SECRET_ADMIN, {
        expiresIn: process.env.JWT_EXPIRE_ADMIN
    })


    return access_token_admin;


}
const setTokenCookie = (res, access_token_admin) => {

    res.cookie('access_token_admin', access_token_admin, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/admin'
    });


};



export const getAdminProfile = async (req, res) => {
    try {

        const adminDetails = await Admin.findById(req.admin._id).select(
            "-password -__v"
        );
        if (!adminDetails) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng đăng nhập",
            });
        }

        return res.status(200).json({
            success: true,
            data: adminDetails,
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



export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username })
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(400).json({
                success: false,
                message: "Thông tin đăng nhập không chính xác",
            })
        }


        const access_token_admin = generatejwttokenAdmin(admin)


        setTokenCookie(res, access_token_admin);
        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công.",
            data: admin,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: " Có lỗi xảy ra khi đăng nhập hệ thống "
        })
    }
}

export const logoutAdmin = async (req, res) => {
    try {



        res.clearCookie('access_token_admin', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/api/v1/admin'
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