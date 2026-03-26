import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/auth-comp/AuthSiteChrome';
import GoogleLoginButton from '../components/auth-comp/GoogleLoginButton';
import { requestSignupOtp } from '../lib/api.js';
import toast from 'react-hot-toast';

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
    <div className="w-full min-h-screen flex flex-col bg-[#f0f2f5] p-5">
      <div className="flex flex-col items-center flex-1">
        <div className="w-full flex justify-center pt-6 pb-26">
          <div className="w-full max-w-[540px] flex-shrink-0 bg-white rounded-lg p-10 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)]">
            <h2 className="text-2xl font-bold text-center text-[#1c1e21] mb-2">
              Sign up
            </h2>
            <form
              className="flex flex-col w-full gap-8"
              onSubmit={handleVerify}
              noValidate
            >
              <div className="flex flex-col gap-1.5 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                  className="peer pt-6 px-4 pb-4 rounded-xl border border-[#dddfe2] bg-white text-[#1c1e21] text-base outline-none transition-[border-color] duration-150 placeholder:text-transparent focus:border-indigo-600"
                />
                <label
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#90949c] pointer-events-none transition-all duration-200 ease-out
                    peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-indigo-600
                    peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-indigo-600"
                >
                  Email address
                </label>
              </div>
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
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
