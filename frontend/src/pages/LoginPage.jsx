import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Logo, Footer } from '../components/auth-comp/AuthSiteChrome';
import FloatingInput from '../components/auth-comp/FloatingInput';
import PasswordInput from '../components/auth-comp/PasswordInput';
import GoogleLoginButton from '../components/auth-comp/GoogleLoginButton';
import { login } from '../lib/api.js';
import { handleAuthSuccess } from '../lib/authUtils.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login({ email, password });
      handleAuthSuccess(data, navigate);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="w-full flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 min-h-[200px] md:min-h-0 flex flex-col justify-end p-6 md:p-10 lg:p-12 bg-white relative">
          <Logo />
          <img
            src="/graphic.jpg"
            alt=""
            className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] object-contain"
          />
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-black leading-tight">
            Stay connected with <span className="text-indigo-600">life</span>
          </h1>
        </div>
        <div className="flex-1 md:flex-[0_0_40%] flex flex-col items-center justify-center py-10 px-6 md:px-16 lg:px-20 bg-[#f0f2f5] min-w-0">
          <h2 className="text-2xl font-bold mb-5 text-center text-[#1c1e21]">
            Log in to ChatApp
          </h2>
          <form
            className="flex flex-col w-full max-w-[400px] gap-8"
            onSubmit={handleSubmit}
            noValidate
          >
            <FloatingInput type="email" value={email} onChange={setEmail} label="Email address" />
            <PasswordInput value={password} onChange={setPassword} label="Password" />
            <button
              type="submit"
              className="px-3 py-2.5 text-base font-semibold rounded-full border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-150 hover:bg-indigo-700 active:bg-indigo-800"
            >
              Log in
            </button>
            <button
              type="button"
              className="block w-full text-center mt-3 text-sm text-indigo-600 hover:underline bg-transparent border-none cursor-pointer"
              onClick={() => navigate('/forgot-password')}
            >
              Forgotten password?
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#dadde1]" />
              <span className="text-sm text-[#606770]">Or continue with</span>
              <div className="flex-1 h-px bg-[#dadde1]" />
            </div>
            <GoogleLoginButton />
            <div className="h-px bg-[#dadde1] my-5" />
            <button
              type="button"
              className="px-3 py-2.5 text-base font-semibold rounded-full border-2 border-indigo-600 bg-transparent text-indigo-600 cursor-pointer transition-colors duration-150 hover:bg-indigo-600/10"
              onClick={() => navigate('/signup')}
            >
              Create new account
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
