import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  function handleToggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button variant='ghost' size='icon' onClick={handleToggleTheme}>
      <Sun className='size-4 scale-100 dark:scale-0' />
      <Moon className='absolute size-4 scale-0 dark:scale-100' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
}
