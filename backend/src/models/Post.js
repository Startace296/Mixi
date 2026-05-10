import mongoose, { Schema } from "mongoose";

const replySchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const commentSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [replySchema],
  },
  {
    timestamps: true,
  },
);

const postSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    caption: {
      type: String,
      trim: true,
      default: "",
      maxlength: 4000,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    imagePublicId: {
      type: String,
      trim: true,
      default: "",
      select: false,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  },
);

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);
