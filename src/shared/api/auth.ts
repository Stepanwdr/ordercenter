import { api } from '@shared/api/base';
import type { User, UserRole } from '@shared/types';

type AuthApiResponse = {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
};

export type RegisterPayload = {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
};

export const registerRequest = async (payload: RegisterPayload) => {
  const response = await api.post<AuthApiResponse>('/auth/register', payload);
  return response.data.data;
};
