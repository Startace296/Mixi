import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === "your_resend_api_key_here") {
  console.error("❌ RESEND_API_KEY chưa được set trong .env");
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "nhoclay6969@gmail.com", // ← email đã verify trên Resend
  subject: "Test email từ Resend",
  text: "Nếu bạn nhận được email này thì Resend đã hoạt động đúng! ✅",
});

if (error) {
  console.error("❌ Gửi thất bại:", error.message);
} else {
  console.log("✅ Gửi thành công! Email ID:", data.id);
}