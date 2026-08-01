import { useInfiniteQuery } from '@tanstack/react-query'
import type { CursorPage } from '@/core/domain/entities/cursor-page'
import type { LogEntry } from '@/core/domain/entities/log-entry'
import { useAxios } from '@/hooks/infra/useAxios'
import { buildLogFilterParams, type LogsFilters } from '@/util/build-log-filters'

export const USE_GET_LOGS_QUERY_KEY = 'logs'

export type UseGetLogsQueryKey = [typeof USE_GET_LOGS_QUERY_KEY, LogsFilters]

export function useGetLogs(filters: LogsFilters) {
  const api = useAxios()
  const key: UseGetLogsQueryKey = [USE_GET_LOGS_QUERY_KEY, filters]
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) =>
      api.get<ReturnType<typeof buildLogFilterParams>, CursorPage<LogEntry>>(
        '/logs',
        buildLogFilterParams(filters, pageParam),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}
