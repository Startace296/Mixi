import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },
    /**
     * Idempotency key the sender's client picks per message. Retrying a send that may
     * already have succeeded (lost response, timeout) returns the stored message
     * instead of creating a duplicate.
     */
    clientMessageId: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes. Messages is the most write-heavy collection, so every index here must earn
// its write cost; low-cardinality fields (type, deletedAt) are filtered after the
// index scan instead of being indexed on their own.

// Timeline: keyset pagination sorts on (createdAt, _id) inside one conversation.
// Equality on conversationId + the full sort key means each page is a bounded index
// range read with no in-memory SORT, whichever direction it pages in. It also serves
// the AI batch queries, "latest message" lookups and deleteMany({ conversationId }).
messageSchema.index(
  { conversationId: 1, createdAt: -1, _id: -1 },
  { name: "conversation_timeline" },
);

// AI reply style samples: one sender's recent messages in a conversation.
messageSchema.index(
  { conversationId: 1, senderId: 1, createdAt: -1 },
  { name: "conversation_sender_recent" },
);

// Deletions since a point in time, for clients catching up after missing socket
// events. Partial: only deleted messages are in it, so ordinary sends never touch it.
messageSchema.index(
  { conversationId: 1, deletedAt: 1 },
  { name: "conversation_deleted", partialFilterExpression: { deletedAt: { $type: "date" } } },
);

// One message per (sender, idempotency key). Partial, so messages without a key (older
// clients, call messages) are not in it and cost nothing.
messageSchema.index(
  { senderId: 1, clientMessageId: 1 },
  {
    name: "sender_client_message",
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string" } },
  },
);

export default mongoose.model("Message", messageSchema);
