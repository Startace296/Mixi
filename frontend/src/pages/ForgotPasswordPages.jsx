import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthCard from '../components/auth-comp/AuthCard';
import FloatingInput from '../components/auth-comp/FloatingInput';
import PasswordInput from '../components/auth-comp/PasswordInput';
import {
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
} from '../services/api.js';

/** /forgot-password */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await requestForgotPasswordOtp({ email: email.trim() });
      toast.success('OTP has been sent to your email.');
      navigate('/forgot-verify', { state: { email: email.trim() } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || !email) return;
    setIsLoading(true);
    try {
      await verifyForgotPasswordOtp({ email, otpCode: code });
      toast.success('OTP verified successfully.');
      navigate('/reset-password', { state: { email, code } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setIsLoading(true);
    try {
      await requestForgotPasswordOtp({ email });
      setTimeLeft(60);
      toast.success('OTP has been resent to your email.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, code } = location.state || {};

  useEffect(() => {
    if (!email || !code) navigate('/forgot-password', { replace: true });
  }, [email, code, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    if (
      !password.trim() ||
      password.trim().length < 8 ||
      password !== confirmPassword
    ) {
      if (!password.trim()) setPasswordError('Password is required');
      else if (password.trim().length < 8) setPasswordError('Password must be at least 8 characters');
      if (password !== confirmPassword) setConfirmError('Password not match');
      return;
    }
    setIsLoading(true);
    try {
      const data = await resetPasswordWithOtp({
        email,
        otpCode: code,
        newPassword: password,
      });
      toast.success(data.message || 'Password reset successful.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
