import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthCard from '../components/auth-comp/AuthCard';
import FloatingInput from '../components/auth-comp/FloatingInput';
import GoogleLoginButton from '../components/auth-comp/GoogleLoginButton';
import { requestSignupOtp } from '../services/api.js';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await requestSignupOtp({ email: email.trim() });
      navigate('/verify', { state: { email: email.trim() } });
      toast.success('OTP has been sent to your email.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Sign up">
      <form
        className="flex flex-col w-full gap-8"
        onSubmit={handleVerify}
        noValidate
      >
        <FloatingInput type="email" value={email} onChange={setEmail} label="Email address" />
        <p className="text-sm text-[#606770]">
          Already have an account?{' '}
          <button
            type="button"
            className="bg-transparent border-none text-indigo-600 font-semibold cursor-pointer hover:underline p-0"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </p>
        <button
          type="submit"
          disabled={isLoading}
          className="px-3 py-2.5 text-base font-semibold rounded-full border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-150 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Verify'}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#dadde1]" />
          <span className="text-sm text-[#606770]">Or continue with</span>
          <div className="flex-1 h-px bg-[#dadde1]" />
        </div>
        <GoogleLoginButton />
      </form>
    </AuthCard>
  );
}
