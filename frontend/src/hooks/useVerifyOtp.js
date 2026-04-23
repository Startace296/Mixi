import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { requestSignupOtp, verifyOtp } from '../lib/api.js';

const OTP_LENGTH = 6;
const OTP_COOLDOWN_SECONDS = 60;

export function useVerifyOtp(email) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_COOLDOWN_SECONDS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return undefined;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!email || code.length !== OTP_LENGTH || isLoading) return;

    setIsLoading(true);
    try {
      await verifyOtp({ email, otpCode: code });
      navigate('/register', { state: { email } });
      toast.success('Email verified successfully.');
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
      await requestSignupOtp({ email });
      setTimeLeft(OTP_COOLDOWN_SECONDS);
      toast.success('OTP resent successfully.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    code,
    setCode,
    timeLeft,
    isLoading,
    handleConfirm,
    handleResend,
  };
}
