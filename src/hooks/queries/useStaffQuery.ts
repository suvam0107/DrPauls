import { useQuery } from '@tanstack/react-query';
import { staffService } from '../../api/services/staffService';
import { queryKeys } from '../../api/queryKeys';
import { StaffUser } from '../../types';

export function useStaffQuery() {
  return useQuery<StaffUser>({
    queryKey: queryKeys.staff.me(),
    queryFn: () => staffService.getStaff(),
  });
}
