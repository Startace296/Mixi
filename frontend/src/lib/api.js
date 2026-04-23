import { axiosInstance } from './axios.js';

// --- Auth ---

export const login = async ({ email, password }) => {
  const response = await axiosInstance.post('/auth/login', { email, password });
  return response.data;
};

export const requestSignupOtp = async ({ email }) => {
  const response = await axiosInstance.post('/auth/request-signup-otp', { email });
  return response.data;
};

export const verifyOtp = async ({ email, otpCode }) => {
  const response = await axiosInstance.post('/auth/verify-otp', { email, otpCode });
  return response.data;
};

export const completeRegistration = async ({
  email,
  password,
  displayName,
  gender,
  day,
  month,
  year,
}) => {
  const response = await axiosInstance.post('/auth/complete-registration', {
    email,
    password,
    displayName,
    gender,
    day,
    month,
    year,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

export const getMyProfile = async () => {
  const response = await axiosInstance.get('/users/me');
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await axiosInstance.patch('/users/me', data);
  return response.data;
};

export const uploadMyAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await axiosInstance.post('/users/me/avatar', formData);
  return response.data;
};

export const searchUsers = async ({ q, limit = 20 } = {}) => {
  const response = await axiosInstance.get('/users/search', {
    params: {
      q,
      limit,
    },
  });
  return response.data;
};

// --- Friends ---

export const getFriends = async ({ q, limit = 20 } = {}) => {
  const response = await axiosInstance.get('/friends', {
    params: {
      q,
      limit,
    },
  });
  return response.data;
};

export const getFriendRequests = async ({ q, limit = 20 } = {}) => {
  const response = await axiosInstance.get('/friends/requests', {
    params: {
      q,
      limit,
    },
  });
  return response.data;
};

export const createFriendRequest = async ({ receiverId }) => {
  const response = await axiosInstance.post('/friends/requests', { receiverId });
  return response.data;
};

export const acceptFriendRequest = async ({ requestId }) => {
  const response = await axiosInstance.post(`/friends/requests/${requestId}/accept`);
  return response.data;
};

export const declineFriendRequest = async ({ requestId }) => {
  const response = await axiosInstance.delete(`/friends/requests/${requestId}`);
  return response.data;
};

// --- Google Auth ---

export const googleLogin = async ({ idToken }) => {
  const response = await axiosInstance.post('/auth/google', { idToken });
  return response.data;
};

export const completeGoogleRegistration = async (data) => {
  const response = await axiosInstance.post('/auth/complete-google-registration', data);
  return response.data;
};

// --- Forgot Password ---

export const requestForgotPasswordOtp = async ({ email }) => {
  const response = await axiosInstance.post('/auth/forgot-password/request-otp', { email });
  return response.data;
};

export const verifyForgotPasswordOtp = async ({ email, otpCode }) => {
  const response = await axiosInstance.post('/auth/forgot-password/verify-otp', { email, otpCode });
  return response.data;
};

export const resetPasswordWithOtp = async ({ email, otpCode, newPassword }) => {
  const response = await axiosInstance.post('/auth/forgot-password/reset', { email, otpCode, newPassword });
  return response.data;
};
