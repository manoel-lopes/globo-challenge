import { useQuery } from '@tanstack/react-query'
import type { DashboardFilters } from '@/core/domain/entities/dashboard-filters'
import type { DashboardTrends } from '@/core/domain/entities/dashboard-trends'
import { useAxios } from '@/hooks/infra/useAxios'

export const USE_GET_DASHBOARD_TRENDS_QUERY_KEY = 'dashboard-trends'

export interface DashboardTrendsFilters extends DashboardFilters {
  bucket?: 'hour' | 'day'
  splitByLevel?: boolean
}

export type UseGetDashboardTrendsQueryKey = [
  typeof USE_GET_DASHBOARD_TRENDS_QUERY_KEY,
  DashboardTrendsFilters,
]

export function useGetDashboardTrends(filters: DashboardTrendsFilters) {
  const api = useAxios()
  const key: UseGetDashboardTrendsQueryKey = [USE_GET_DASHBOARD_TRENDS_QUERY_KEY, filters]
  return useQuery({
    queryKey: key,
    queryFn: () =>
      api.get<DashboardTrendsFilters, DashboardTrends>('/dashboard/trends', filters),
  })
}
