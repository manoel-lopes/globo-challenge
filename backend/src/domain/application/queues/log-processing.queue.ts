export type LogProcessingJob = {
  logFileId: string
  filePath: string
}

export type LogProcessingQueue = {
  enqueue(job: LogProcessingJob): Promise<void>
}

export const LogProcessingQueue = Symbol('LogProcessingQueue')
