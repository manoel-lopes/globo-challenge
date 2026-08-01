import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { LogFile } from '@/core/domain/entities/log-file'
import type { OffsetPage } from '@/core/domain/entities/offset-page'
import { useAxios } from '@/hooks/infra/useAxios'

export const USE_GET_LOG_FILES_QUERY_KEY = 'log-files'

export interface LogFilesFilters {
  page?: number
  pageSize?: number
  order?: 'asc' | 'desc'
}

export type UseGetLogFilesQueryKey = [typeof USE_GET_LOG_FILES_QUERY_KEY, LogFilesFilters]

export function useGetLogFiles(filters: LogFilesFilters = {}) {
  const api = useAxios()
  const key: UseGetLogFilesQueryKey = [USE_GET_LOG_FILES_QUERY_KEY, filters]
  return useQuery({
    queryKey: key,
    queryFn: () => api.get<LogFilesFilters, OffsetPage<LogFile>>('/log-files', filters),
    placeholderData: keepPreviousData,
  })
}
