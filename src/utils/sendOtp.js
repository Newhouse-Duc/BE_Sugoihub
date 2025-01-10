import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otp.modal.js";
import transporter from "../config/nodemailer.js";
import EmailTemplate from '../templates/emailTemplate.js';



async function sendOTP(email, action) {
    try {
        await transporter.verify();
        console.log('Connection successful');

        const otpCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);


        await Otp.deleteMany({ email, action });

        const newOtp = new Otp({
            email,
            otp: otpCode,
            expiresAt,
            action
        });

        const mailOptions = {
            from: `"SugoiHub" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `SugoiHub - Mã OTP ${action === 'resetPassword' ? 'đặt lại mật khẩu' : 'xác nhận tài khoản'}`,
            html: EmailTemplate(otpCode)
        };

        try {
            await transporter.sendMail(mailOptions);
            await newOtp.save();
            return otpCode;
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send OTP email');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}




export default sendOTP;
