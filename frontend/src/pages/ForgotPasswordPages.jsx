import AuthCard from '../components/auth-comp/AuthCard';
import FloatingInput from '../components/auth-comp/FloatingInput';
import PasswordInput from '../components/auth-comp/PasswordInput';
import {
  useForgotPasswordRequest,
  useForgotPasswordVerify,
  useResetPassword,
} from '../hooks/useForgotPassword.js';

/** /forgot-password */
export function ForgotPasswordPage() {
  const { email, setEmail, isLoading, handleSubmit, navigate } = useForgotPasswordRequest();

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a 6-digit code to reset your password."
    >
      <form
        className="flex flex-col w-full gap-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <FloatingInput type="email" value={email} onChange={setEmail} label="Email address" />
        <button
          type="submit"
          className="px-3 py-2.5 text-base font-semibold rounded-full border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-150 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!email.trim() || isLoading}
        >
          {isLoading ? 'Sending...' : 'Send reset code'}
        </button>
        <p className="text-sm text-[#606770] text-center">
          <button
            type="button"
            className="bg-transparent border-none text-indigo-600 font-semibold cursor-pointer hover:underline p-0"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </p>
      </form>
    </AuthCard>
  );
}

/** /forgot-verify */
export function ForgotVerifyPage() {
  const { email, code, setCode, timeLeft, isLoading, handleVerify, handleResend } = useForgotPasswordVerify();

  if (!email) return null;

  return (
    <AuthCard
      title="Reset password"
      subtitle="We sent a 6-digit code to your email. Enter it below."
    >
      <form
        className="flex flex-col w-full gap-8"
        onSubmit={handleVerify}
        noValidate
      >
        <div className="flex flex-col gap-1.5 relative">
          <input
            type="text"
            autoComplete="off"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder=" "
            maxLength={6}
            required
            className="peer pt-6 px-4 pb-4 rounded-xl border border-[#dddfe2] bg-white text-[#1c1e21] text-2xl text-center tracking-[0.5em] outline-none transition-[border-color] duration-150 placeholder:text-transparent focus:border-indigo-600"
          />
          <label
            className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-base text-[#90949c] pointer-events-none transition-all duration-200 ease-out
              peer-focus:top-1.5 peer-focus:-translate-x-1/2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-indigo-600
              peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:-translate-x-1/2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-indigo-600"
          >
            Verification code
          </label>
        </div>
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="bg-transparent border-none text-indigo-600 text-sm font-medium cursor-pointer hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
            onClick={handleResend}
            disabled={timeLeft > 0 || isLoading}
          >
            Resend code
          </button>
          {timeLeft > 0 && (
            <span className="text-sm text-[#606770]">
              Code expired in {timeLeft}s
            </span>
          )}
        </div>
        <button
          type="submit"
          className="px-3 py-2.5 text-base font-semibold rounded-full border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-150 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={code.length !== 6 || timeLeft <= 0 || isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </AuthCard>
  );
}

/** /reset-password */
export function ResetPasswordPage() {
  const {
    email,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    confirmError,
    setConfirmError,
    isLoading,
    handleSubmit,
  } = useResetPassword();

  if (!email) return null;

  return (
    <AuthCard
      title="Create new password"
      subtitle="Enter your new password below."
    >
      <form
        className="flex flex-col w-full gap-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <FloatingInput type="email" value={email} readOnly label="Email" />
        <PasswordInput
          value={password}
          onChange={(v) => { setPassword(v); setPasswordError(''); }}
          label="New password"
          autoComplete="new-password"
          minLength={8}
          error={passwordError || undefined}
        />
        <PasswordInput
          value={confirmPassword}
          onChange={(v) => { setConfirmPassword(v); setConfirmError(''); }}
          label="Confirm new password"
          autoComplete="new-password"
          minLength={8}
          error={confirmError || undefined}
        />
        <button
          type="submit"
          className="px-3 py-2.5 text-base font-semibold rounded-full border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-150 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={
            isLoading ||
            !password.trim() ||
            password.trim().length < 8 ||
            password !== confirmPassword
          }
        >
          {isLoading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthCard>
  );
}
