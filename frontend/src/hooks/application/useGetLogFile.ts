import { useQuery } from '@tanstack/react-query'
import type { LogFile, LogFileStatus } from '@/core/domain/entities/log-file'
import { useAxios } from '@/hooks/infra/useAxios'

export const USE_GET_LOG_FILE_QUERY_KEY = 'log-file'

export type UseGetLogFileQueryKey = [typeof USE_GET_LOG_FILE_QUERY_KEY, { id: string }]

const PROCESSING_STATUSES: LogFileStatus[] = ['PENDING', 'PROCESSING']
const POLLING_INTERVAL_MS = 1500

export function useGetLogFile(logFileId: string) {
  const api = useAxios()
  const key: UseGetLogFileQueryKey = [USE_GET_LOG_FILE_QUERY_KEY, { id: logFileId }]
  return useQuery({
    queryKey: key,
    queryFn: () => api.get<void, LogFile>(`/log-files/${logFileId}`),
    enabled: !!logFileId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && PROCESSING_STATUSES.includes(status) ? POLLING_INTERVAL_MS : false
    },
  })
}
