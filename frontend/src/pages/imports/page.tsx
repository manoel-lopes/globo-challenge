import { createFileRoute } from '@tanstack/react-router'
import { LogFilesTable } from '@/components/imports/log-files-table'
import { UploadDropzone } from '@/components/imports/upload-dropzone'

export const Route = createFileRoute('/imports')({
  component: ImportsPage,
})

function ImportsPage() {
  return (
    <div className='mx-auto flex max-w-7xl flex-col gap-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-balance'>Imports</h1>
        <p className='text-sm text-muted-foreground'>
          Upload log files and track processing status as entries become available.
        </p>
      </header>
      <UploadDropzone />
      <LogFilesTable />
    </div>
  )
}
