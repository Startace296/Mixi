import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { logout } from '../lib/api.js';

export default function HomePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const data = await logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success(data.message || 'Logout successful');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5]">
      <h1 className="text-2xl font-bold text-[#1c1e21] mb-6">Home</h1>
      <button
        type="button"
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-red-500 text-red-600 hover:bg-red-50 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}