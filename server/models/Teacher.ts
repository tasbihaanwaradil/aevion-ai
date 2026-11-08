import mongoose, { Document } from "mongoose";
export interface ITeacher extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    isEmailVerified: boolean;
    verificationCode?: string;
    verificationCodeExpires?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}
const TeacherSchema = new mongoose.Schema(
{
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: false
    },
    googleId: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null,
        select: false
    },
    verificationCodeExpires: {
        type: Date,
        default: null,
        select: false
    },
    resetPasswordToken: {
        type: String,
        default: null,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
        select: false
    }
},
{ timestamps: true }
);
const Teacher =
    mongoose.models.Teacher || mongoose.model("Teacher", TeacherSchema);
export default Teacher;