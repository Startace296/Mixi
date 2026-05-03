import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      index: true,
    },
    participantIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    pairKey: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageText: {
      type: String,
      trim: true,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => ({}),
    },
    hiddenBy: {
      type: Map,
      of: Date,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index(
  { pairKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "direct",
      pairKey: { $type: "string" },
    },
  },
);
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
