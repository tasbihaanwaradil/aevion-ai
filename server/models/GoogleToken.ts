import mongoose, { Document } from "mongoose";

export interface IGoogleToken extends Document {
  userId: mongoose.Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  expiry: Date;
}

const GoogleTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    accessToken: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
      required: true,
    },

    expiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGoogleToken>(
  "GoogleToken",
  GoogleTokenSchema
);