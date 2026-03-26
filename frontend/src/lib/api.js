import { axiosInstance } from './axios.js';

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

export const completeRegistration = async ({ email, password, displayName }) => {
  const response = await axiosInstance.post('/auth/complete-registration', {
    email,
    password,
    displayName,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

export const googleLogin = async ({ idToken }) => {
  const response = await axiosInstance.post('/auth/google', { idToken });
  return response.data;
};

export const completeGoogleRegistration = async (data) => {
  const response = await axiosInstance.post('/auth/complete-google-registration', data);
  return response.data;
};

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

