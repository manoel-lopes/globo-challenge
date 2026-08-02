import { LogLevelBadge } from '@/components/log-level-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LogEntry } from '@/core/domain/entities/log-entry'
import { formatDateTime } from '@/util/format-date'

interface LogEntryDetailDialogProps {
  entry: LogEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='grid gap-1 sm:grid-cols-[7rem_1fr] sm:items-start sm:gap-3'>
      <dt className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>{label}</dt>
      <dd className='min-w-0 text-sm break-words'>{children}</dd>
    </div>
  )
}

export function LogEntryDetailDialog({ entry, open, onOpenChange }: LogEntryDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Log entry</DialogTitle>
          <DialogDescription>Full details for the selected log line.</DialogDescription>
        </DialogHeader>
        {entry ? (
          <dl className='space-y-4'>
            <DetailRow label='Level'>
              <LogLevelBadge level={entry.level} />
            </DetailRow>
            <DetailRow label='Timestamp'>{formatDateTime(entry.timestamp)}</DetailRow>
            <DetailRow label='Source'>{entry.source ?? '—'}</DetailRow>
            <DetailRow label='Message'>{entry.message}</DetailRow>
            <DetailRow label='Raw line'>
              <pre className='overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs whitespace-pre-wrap'>
                {entry.rawLine}
              </pre>
            </DetailRow>
            <DetailRow label='Metadata'>
              {entry.metadata ? (
                <pre className='overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs whitespace-pre-wrap'>
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              ) : (
                '—'
              )}
            </DetailRow>
          </dl>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
