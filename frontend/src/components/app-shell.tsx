import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Menu, ScrollText, UploadCloud } from 'lucide-react'
import { NavLink } from '@/components/nav-link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface AppShellProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/imports', label: 'Imports', icon: UploadCloud },
] as const

interface SidebarNavProps {
  onNavigate?: () => void
}

function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <nav className='flex flex-col gap-1'>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          onClick={onNavigate}
        />
      ))}
    </nav>
  )
}

function BrandLink() {
  return (
    <Link to='/' className='flex items-center gap-2 px-2 text-lg font-semibold tracking-tight'>
      <span className='flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground'>
        <ScrollText className='size-4' />
      </span>
      Log Analytics
    </Link>
  )
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  return (
    <div className='min-h-svh md:grid md:grid-cols-[16rem_1fr]'>
      <aside className='hidden border-r bg-sidebar md:sticky md:top-0 md:flex md:h-svh md:flex-col md:gap-6 md:p-4'>
        <BrandLink />
        <SidebarNav />
      </aside>
      <div className='flex flex-col'>
        <header className='sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:justify-end'>
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='md:hidden'>
                <Menu className='size-5' />
                <span className='sr-only'>Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64 p-4'>
              <SheetTitle className='sr-only'>Navigation</SheetTitle>
              <div className='flex flex-col gap-6'>
                <BrandLink />
                <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <span className='text-sm font-semibold md:hidden'>Log Analytics</span>
          <ThemeToggle />
        </header>
        <main className='flex-1 p-4 md:p-6'>{children}</main>
      </div>
    </div>
  )
}
