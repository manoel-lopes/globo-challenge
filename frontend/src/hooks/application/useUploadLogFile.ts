import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LogFile } from '@/core/domain/entities/log-file'
import { USE_GET_LOG_FILES_QUERY_KEY } from '@/hooks/application/useGetLogFiles'
import { useAxios } from '@/hooks/infra/useAxios'

export interface UploadLogFileInput {
  file: File
  onProgress?: (percent: number) => void
}

export function useUploadLogFile() {
  const api = useAxios()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, onProgress }: UploadLogFileInput) => {
      const formData = new FormData()
      formData.append('file', file)

      return api.post<FormData, LogFile>('/log-files', formData, {
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return
          onProgress(Math.round((event.loaded / event.total) * 100))
        },
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [USE_GET_LOG_FILES_QUERY_KEY] })
    },
  })
}
