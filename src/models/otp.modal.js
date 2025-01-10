
import mongoose from "mongoose";


export const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: Number,
        required: true,
    },
    expiresAt: {
        type: Date,
        index: { expires: 0 },

    },
    action: {
        type: String,
        enum: ["register", "resetPassword", "verifyEmail"],
        required: true
    },
},
    { timestamps: true }
);

const Otp = mongoose.model("Otp", OtpSchema);

export default Otp;
