import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        minlength: 3,
        maxlength: 50,
        trim: true,
        required: true
    },
    username: {
        type: String,
        minlength: 3,
        maxlength: 30,
        lowercase: true,
        trim: true,
        unique: true,
        required: true
    },
    email: {
        type: String,
        minlength: 5,
        maxlength: 255,
        lowercase: true,
        trim: true,
        unique: true,
        sparse: true,
        index: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
        default: ""
    },
    refreshToken: {
        type: String,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });   

userSchema.pre("save", async function (this: any, next: any) {
    if (!this.password || !this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m", algorithm: "HS256" });
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d", algorithm: "HS256" });
}

export const User = mongoose.model("User", userSchema);