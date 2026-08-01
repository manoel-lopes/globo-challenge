import { useState } from 'react'
import { MutationCache, QueryClient, QueryClientProvider as ReactQueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/util/get-error-message'

interface QueryClientProviderProps {
  children: React.ReactNode
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(getErrorMessage(error))
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  return (
    <ReactQueryClientProvider client={queryClient}>{children}</ReactQueryClientProvider>
  )
}
