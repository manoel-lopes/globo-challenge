import { useCallback, useRef, useState } from 'react'
import { FileUp, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useUploadLogFile } from '@/hooks/application/useUploadLogFile'
import { formatBytes } from '@/util/format-number'
import { cn } from '@/lib/utils'

const ACCEPTED_EXTENSIONS = ['.log', '.txt', '.jsonl', '.json']
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [activeFileName, setActiveFileName] = useState<string | null>(null)
  const upload = useUploadLogFile()

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      if (!isAcceptedFile(file)) {
        toast.error(`Unsupported file type. Use ${ACCEPTED_EXTENSIONS.join(', ')}.`)
        return
      }

      setActiveFileName(file.name)
      setProgress(0)

      try {
        const result = await upload.mutateAsync({
          file,
          onProgress: setProgress,
        })
        toast.success(
          result.status === 'COMPLETED'
            ? `Imported ${result.filename} (${result.processedLines} lines).`
            : `Upload started for ${result.filename}. Processing in background…`,
        )
      } catch {
      } finally {
        setProgress(null)
        setActiveFileName(null)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [upload],
  )
  return (
    <div
      role='button'
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setIsDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        handleFile(event.dataTransfer.files[0])
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/40',
        upload.isPending && 'pointer-events-none opacity-80',
      )}
    >
      <span className='flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <UploadCloud className='size-5' />
      </span>
      <div className='space-y-1'>
        <p className='text-sm font-medium'>
          {upload.isPending ? 'Uploading…' : 'Drop a log file here, or click to browse'}
        </p>
        <p className='text-sm text-muted-foreground'>
          Accepts {ACCEPTED_EXTENSIONS.join(', ')}
        </p>
      </div>
      {activeFileName && progress !== null ? (
        <div className='w-full max-w-sm space-y-2'>
          <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
            <span className='truncate'>{activeFileName}</span>
            <span className='tabular-nums'>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : (
        <Button
          type='button'
          variant='secondary'
          size='sm'
          onClick={(event) => {
            event.stopPropagation()
            inputRef.current?.click()
          }}
        >
          <FileUp className='size-4' />
          Choose file
        </Button>
      )}
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPT_ATTR}
        className='sr-only'
        onChange={(event) => {
          handleFile(event.target.files?.[0])
        }}
      />
      {upload.isPending && activeFileName ? (
        <p className='text-xs text-muted-foreground'>
          Preparing {activeFileName}
          {upload.variables?.file ? ` (${formatBytes(upload.variables.file.size)})` : ''}…
        </p>
      ) : null}
    </div>
  )
}
