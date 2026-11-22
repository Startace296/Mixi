import { afterAll, afterEach, beforeAll, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Must be set before any src module is imported (env.js reads them at import time).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";

// Never hit a real SMTP server in tests. Tests read the OTP from this mock.
vi.mock("../src/lib/mailer.js", () => ({
  sendOtpEmail: vi.fn(async () => ({ delivered: true })),
}));

// Never upload to Cloudinary: each upload "succeeds" with a fake URL. The real
// isAllowedImageType is kept so the service-level mime check still runs.
vi.mock("../src/lib/image-upload.js", async (importOriginal) => {
  const actual = await importOriginal();
  const fakeUpload = (folder) => vi.fn(async () => ({
    secure_url: `https://cdn.test/${folder}/image.jpg`,
    public_id: `${folder}/image`,
  }));
  return {
    ...actual,
    uploadChatImage: fakeUpload("messages"),
    uploadGroupAvatar: fakeUpload("group-avatars"),
    uploadPostImage: fakeUpload("posts"),
    uploadUserAvatar: fakeUpload("avatars"),
  };
});

// Never call Gemini. AI tests set the response with generateGeminiJson.mockResolvedValueOnce().
vi.mock("../src/lib/gemini.js", () => ({
  generateGeminiJson: vi.fn(async () => ({})),
}));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  vi.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});
