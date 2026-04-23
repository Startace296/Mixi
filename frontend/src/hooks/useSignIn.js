import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { login } from '../lib/api.js';
import { useAuthStore } from '../stores/useAuthStore.js';

export function useSignIn() {
  const navigate = useNavigate();
  const applyAuthSuccess = useAuthStore((state) => state.applyAuthSuccess);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const data = await login({ email, password });
      applyAuthSuccess(data);
      toast.success(data.message || 'Login successful');
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleSubmit,
  };
}
