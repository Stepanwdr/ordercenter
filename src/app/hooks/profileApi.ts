import { api } from '@shared/api/base';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/types';

export const useProfileQuery = () =>
  useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      // Backend returns { success, data: user }
      const data = (res.data && (res.data as any).data) || res.data;
      return data as User;
    },
  });
;
