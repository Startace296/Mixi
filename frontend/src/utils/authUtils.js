import toast from 'react-hot-toast';

export function saveAuthSuccess(data) {
  if (data.token) localStorage.setItem('token', data.token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
}

export function handleAuthSuccess(data, navigate, message = 'Login successful') {
  saveAuthSuccess(data);
  toast.success(data.message || message);
  navigate('/home', { replace: true });
}
