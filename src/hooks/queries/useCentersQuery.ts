import { useQuery } from '@tanstack/react-query';
import { centerService } from '../../api/services/centerService';
import { queryKeys } from '../../api/queryKeys';
import { dataStore } from '../../api/dataStore';
import { Center } from '../../types';

export function useCentersQuery() {
  return useQuery<Center[]>({
    queryKey: queryKeys.centers.all(),
    queryFn: () => centerService.getAll(),
    initialData: () => dataStore.getData().centers,
  });
}
