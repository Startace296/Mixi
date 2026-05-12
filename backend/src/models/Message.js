import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
      maxlength: 4000,
    },
    type: {
      type: String,
      enum: ["text", "image", "call"],
      default: "text",
      index: true,
    },
    call: {
      callId: {
        type: String,
        trim: true,
        default: "",
      },
      mode: {
        type: String,
        enum: ["voice", "video"],
        default: "voice",
      },
      status: {
        type: String,
        enum: ["cancelled", "declined", "missed", "ended"],
        default: "ended",
      },
      durationSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },
      startedAt: {
        type: Date,
        default: null,
      },
      endedAt: {
        type: Date,
        default: null,
      },
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ conversationId: 1, createdAt: -1, deletedAt: 1 });

export default mongoose.model("Message", messageSchema);
