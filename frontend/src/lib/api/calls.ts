/** Voice call setup. */
import { axiosInstance } from './client';
import type { TurnCredentialsResponse } from '../../types';

/** ICE servers (STUN + short-lived TURN credentials) for a WebRTC call. */
export const getTurnCredentials = async () => {
  const response = await axiosInstance.get<TurnCredentialsResponse>('/calls/turn-credentials');
  return response.data;
};
