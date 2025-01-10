import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const UserSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
        },
        username: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            default: "",
        },
        refreshToken: {
            type: String,
            default: null
        },
        avatar: {
            url: {
                type: String,
                default: "",
            },
            publicId: {
                type: String,
                default: "",
            },
        },
        birthDate: {
            type: Date,
            required: true,
        },
        bio: {
            type: String,

        },
        isActive: {
            type: Boolean,
            default: false,
        },
        ban: {
            type: Boolean,
            default: false,
        },
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],

    },
    { timestamps: true }
);

UserSchema.pre("save", function (next) {
    if (!this.isModified("password")) return next();
    bcrypt.hash(this.password, 10, (err, hash) => {
        if (err) return next(err);
        this.password = hash;
        next();
    });
});

const User = mongoose.model("User", UserSchema);

export default User;
