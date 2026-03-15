import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        minlength: 3,
        maxlength: 50,
        trim: true,
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

export const User = mongoose.model("User", userSchema);
