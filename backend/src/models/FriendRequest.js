import mongoose, { Schema } from "mongoose";

const friendRequestSchema = new Schema(
  {
    pairLowId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pairHighId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted","rejected"],
      default: "pending",
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

friendRequestSchema.index({ pairLowId: 1, pairHighId: 1 }, { unique: true });
friendRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
friendRequestSchema.index({ requestedById: 1, status: 1, createdAt: -1 });

export default mongoose.model("FriendRequest", friendRequestSchema);
