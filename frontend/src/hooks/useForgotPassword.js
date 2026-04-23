import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
  verifyForgotPasswordOtp,
} from '../lib/api.js';

const OTP_LENGTH = 6;
const OTP_COOLDOWN_SECONDS = 60;

export function useForgotPasswordRequest() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || isLoading) return;

    setIsLoading(true);
    try {
      await requestForgotPasswordOtp({ email: normalizedEmail });
      toast.success('OTP has been sent to your email.');
      navigate('/forgot-verify', { state: { email: normalizedEmail } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { email, setEmail, isLoading, handleSubmit, navigate };
}

export function useForgotPasswordVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_COOLDOWN_SECONDS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return undefined;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || code.length !== OTP_LENGTH || isLoading) return;

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
    if (!email || timeLeft > 0 || isLoading) return;
    setIsLoading(true);
    try {
      await requestForgotPasswordOtp({ email });
      setTimeLeft(OTP_COOLDOWN_SECONDS);
      toast.success('OTP has been resent to your email.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    code,
    setCode,
    timeLeft,
    isLoading,
    handleVerify,
    handleResend,
  };
}

export function useResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, code } = location.state || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email || !code) navigate('/forgot-password', { replace: true });
  }, [email, code, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');

    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    if (password.trim().length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError('Password not match');
      return;
    }
    if (isLoading) return;

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

  return {
    email,
    code,
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
  };
}
