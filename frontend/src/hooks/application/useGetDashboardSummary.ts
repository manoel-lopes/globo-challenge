import { useQuery } from '@tanstack/react-query'
import type { DashboardFilters } from '@/core/domain/entities/dashboard-filters'
import type { DashboardSummary } from '@/core/domain/entities/dashboard-summary'
import { useAxios } from '@/hooks/infra/useAxios'

export const USE_GET_DASHBOARD_SUMMARY_QUERY_KEY = 'dashboard-summary'

export type UseGetDashboardSummaryQueryKey = [
  typeof USE_GET_DASHBOARD_SUMMARY_QUERY_KEY,
  DashboardFilters,
]

export function useGetDashboardSummary(filters: DashboardFilters) {
  const api = useAxios()
  const key: UseGetDashboardSummaryQueryKey = [USE_GET_DASHBOARD_SUMMARY_QUERY_KEY, filters]
  return useQuery({
    queryKey: key,
    queryFn: () => api.get<DashboardFilters, DashboardSummary>('/dashboard/summary', filters),
  })
}
