import { useQuery } from '@tanstack/react-query'
import type { DashboardFilters } from '@/core/domain/entities/dashboard-filters'
import type { TopSource } from '@/core/domain/entities/top-source'
import { useAxios } from '@/hooks/infra/useAxios'

export const USE_GET_TOP_SOURCES_QUERY_KEY = 'dashboard-top-sources'

export interface TopSourcesFilters extends DashboardFilters {
  limit?: number
  by?: 'volume' | 'errorRate'
}

export type UseGetTopSourcesQueryKey = [typeof USE_GET_TOP_SOURCES_QUERY_KEY, TopSourcesFilters]

export function useGetTopSources(filters: TopSourcesFilters) {
  const api = useAxios()
  const key: UseGetTopSourcesQueryKey = [USE_GET_TOP_SOURCES_QUERY_KEY, filters]
  return useQuery({
    queryKey: key,
    queryFn: () => api.get<TopSourcesFilters, TopSource[]>('/dashboard/top-sources', filters),
  })
}
