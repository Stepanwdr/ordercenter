import { api } from '@shared/api/base';
import { useMutation } from '@tanstack/react-query';
import type { User, UserRole } from '@shared/types';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { name: string; email: string; password: string; role: UserRole };
type AuthResponse = { user: User; accessToken: string; refreshToken: string };

export const useLoginMutation = () =>
  useMutation<AuthResponse, unknown, LoginPayload>(async (payload) => {
    const res = await api.post<AuthResponse>(`/auth/login`, payload);
    return res.data;
  });

export const useRegisterMutation = () =>
  useMutation<AuthResponse, unknown, RegisterPayload>(async (payload) => {
    const res = await api.post<AuthResponse>(`/auth/register`, payload);
    return res.data;
  });
