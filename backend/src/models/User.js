import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
{
  displayName: {
    type: String,
    trim: true,
    maxlength: 80,
    default: ""
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },

  passwordHash: {
    type: String,
    minlength: 20,
    select: false
  },

  avatarUrl: {
    type: String,
    trim: true,
    default: ""
  },

  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },

  providerId: {
    type: String
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  otpCode: {
    type: String,
    select: false
  },

  otpExpiresAt: {
    type: Date,
    select: false
  },

  otpAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  refreshTokenHash: {
    type: String,
    select: false
  },

  refreshTokenExpiresAt: {
    type: Date,
    select: false
  },

  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  lockUntil: {
    type: Date,
    select: false
  },

  lastLoginAt: {
    type: Date
  },

  gender: {
    type: String,
    trim: true,
    default: ""
  },

  bio: {
    type: String,
    trim: true,
    default: ""
  },

  location: {
    type: String,
    trim: true,
    default: ""
  },

  dateOfBirth: {
    type: Date
  }
},
{
  timestamps: true
},
);
userSchema.index(
  { provider: 1, providerId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      provider: "google",
      providerId: { $type: "string" }
    }
  }
);

export default mongoose.model("User", userSchema);
