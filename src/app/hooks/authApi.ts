import { useMutation } from '@tanstack/react-query';
import { registerRequest, type RegisterPayload } from '@shared/api/auth';

export const useRegisterMutation = () =>
  useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: async (payload: RegisterPayload) => registerRequest(payload),
  });
