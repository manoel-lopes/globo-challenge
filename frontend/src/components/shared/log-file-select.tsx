import { FileText } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetLogFiles } from '@/hooks/application/useGetLogFiles'

const ALL_FILES_VALUE = '__all__'

interface LogFileSelectProps {
  value?: string
  onChange: (logFileId: string | undefined) => void
  className?: string
}

export function LogFileSelect({ value, onChange, className }: LogFileSelectProps) {
  const { data } = useGetLogFiles({ page: 1, pageSize: 100, order: 'desc' })
  const files = data?.items ?? []
  return (
    <Select
      value={value ?? ALL_FILES_VALUE}
      onValueChange={(next) => onChange(next === ALL_FILES_VALUE ? undefined : next)}
    >
      <SelectTrigger className={className} aria-label='Log file'>
        <FileText className='size-4 text-muted-foreground' />
        <SelectValue placeholder='All files' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_FILES_VALUE}>All files</SelectItem>
        {files.map((file) => (
          <SelectItem key={file.id} value={file.id}>
            <span className='max-w-[16rem] truncate'>{file.filename}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
