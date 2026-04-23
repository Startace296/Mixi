import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { requestSignupOtp } from '../lib/api.js';

export function useRegister() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || isLoading) return;

    setIsLoading(true);
    try {
      await requestSignupOtp({ email: normalizedEmail });
      navigate('/verify', { state: { email: normalizedEmail } });
      toast.success('OTP has been sent to your email.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    handleVerify,
  };
}
