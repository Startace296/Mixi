/** Sign-up, login, Google sign-in, password reset and change. */
import { axiosInstance } from './client';
import type {
  ApiSuccess,
  AuthSuccessResponse,
  CompleteGoogleRegistrationParams,
  CompleteRegistrationParams,
  GoogleLoginResponse,
  RequestSignupOtpResponse,
  VerifyOtpResponse,
} from '../../types';

export const login = async ({ email, password }: { email: string; password: string }) => {
  const response = await axiosInstance.post<AuthSuccessResponse>('/auth/login', { email, password });
  return response.data;
};

export const requestSignupOtp = async ({ email }: { email: string }) => {
  const response = await axiosInstance.post<RequestSignupOtpResponse>('/auth/request-signup-otp', { email });
  return response.data;
};

export const verifyOtp = async ({ email, otpCode }: { email: string; otpCode: string }) => {
  const response = await axiosInstance.post<VerifyOtpResponse>('/auth/verify-otp', { email, otpCode });
  return response.data;
};

export const completeRegistration = async ({
  email,
  registrationToken,
  password,
  displayName,
  gender,
  day,
  month,
  year,
}: CompleteRegistrationParams) => {
  const response = await axiosInstance.post<AuthSuccessResponse>('/auth/complete-registration', {
    email,
    registrationToken,
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
  const response = await axiosInstance.post<ApiSuccess>('/auth/logout');
  return response.data;
};

export const googleLogin = async ({ idToken }: { idToken: string }) => {
  const response = await axiosInstance.post<GoogleLoginResponse>('/auth/google', { idToken });
  return response.data;
};

export const completeGoogleRegistration = async (data: CompleteGoogleRegistrationParams) => {
  const response = await axiosInstance.post<AuthSuccessResponse>('/auth/complete-google-registration', data);
  return response.data;
};

export const requestForgotPasswordOtp = async ({ email }: { email: string }) => {
  const response = await axiosInstance.post<ApiSuccess>('/auth/forgot-password/request-otp', { email });
  return response.data;
};

export const verifyForgotPasswordOtp = async ({ email, otpCode }: { email: string; otpCode: string }) => {
  const response = await axiosInstance.post<ApiSuccess>('/auth/forgot-password/verify-otp', { email, otpCode });
  return response.data;
};

export const resetPasswordWithOtp = async ({
  email,
  otpCode,
  newPassword,
}: {
  email: string;
  otpCode: string;
  newPassword: string;
}) => {
  const response = await axiosInstance.post<ApiSuccess>('/auth/forgot-password/reset', {
    email,
    otpCode,
    newPassword,
  });
  return response.data;
};

export const changePassword = async ({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) => {
  const response = await axiosInstance.post<ApiSuccess>('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};
