export { requestSignupOtp, verifyOtp, completeRegistration } from "./signup.service.js";
export { loginLocalUser } from "./login.service.js";
export { loginWithGoogle, completeGoogleRegistration } from "./google.service.js";
export {
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
  changePassword,
} from "./password.service.js";
