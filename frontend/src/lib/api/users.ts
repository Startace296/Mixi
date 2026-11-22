/** The signed-in user's profile and looking up other users. */
import { axiosInstance } from './client';
import type {
  Id,
  SearchParams,
  SearchUsersResponse,
  UpdateProfileParams,
  UserProfileResponse,
  UserResponse,
} from '../../types';

export const getMyProfile = async () => {
  const response = await axiosInstance.get<UserResponse>('/users/me');
  return response.data;
};

export const updateMyProfile = async (data: UpdateProfileParams) => {
  const response = await axiosInstance.patch<UserResponse>('/users/me', data);
  return response.data;
};

export const uploadMyAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await axiosInstance.post<UserResponse>('/users/me/avatar', formData);
  return response.data;
};

export const searchUsers = async ({ q, limit = 20 }: SearchParams = {}) => {
  const response = await axiosInstance.get<SearchUsersResponse>('/users/search', {
    params: {
      q,
      limit,
    },
  });
  return response.data;
};

export const getUserProfile = async ({ userId }: { userId: Id }) => {
  const response = await axiosInstance.get<UserProfileResponse>(`/users/${userId}`);
  return response.data;
};
