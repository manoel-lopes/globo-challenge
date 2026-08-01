import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface NavLinkProps extends React.ComponentProps<typeof Link> {
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export function NavLink({ icon: Icon, label, className, ...linkProps }: NavLinkProps) {
  return (
    <Link
      {...linkProps}
      activeOptions={{ exact: linkProps.to === '/' }}
      activeProps={{
        className: 'bg-sidebar-accent text-sidebar-accent-foreground',
        'aria-current': 'page',
      }}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className,
      )}
    >
      <Icon className='size-4 shrink-0' />
      {label}
    </Link>
  )
}
