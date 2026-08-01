import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClientProvider } from '@/providers/query-client-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { router } from './router'

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
