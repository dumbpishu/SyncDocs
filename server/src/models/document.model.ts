import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "Untitled Document",
        trim: true,
        minlength: 1,
        maxlength: 255
    },
    content: {
        type: String,
        default: ""
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    collaborators: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            role: {
                type: String,
                enum: ["editor", "viewer"],
                default: "viewer"
            }
        }
    ],
    version: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

documentSchema.index({ owner: 1 });
documentSchema.index({ owner: 1, isDeleted: 1, updatedAt: -1 });
documentSchema.index({ "collaborators.user": 1, isDeleted: 1, updatedAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
