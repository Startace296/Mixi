import mongoose, { Schema } from "mongoose";

/**
 * How far one member has received / read this conversation: a watermark on the
 * timeline's (createdAt, _id) order. A message is delivered to (read by) the member
 * iff its key is <= the watermark. Watermarks only move forward (see receipt.service.js),
 * so one small write acknowledges any number of messages, in any order, from any tab.
 */
const receiptSchema = new Schema(
  {
    deliveredAt: { type: Date, default: null },
    deliveredMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    readAt: { type: Date, default: null },
    readMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { _id: false },
);

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
    lastMessageSenderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    /** Delivery / read watermarks, keyed by member id. */
    receipts: {
      type: Map,
      of: receiptSchema,
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
