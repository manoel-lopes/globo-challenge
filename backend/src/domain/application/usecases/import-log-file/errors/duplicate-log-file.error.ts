export class DuplicateLogFileError extends Error {
  readonly existingLogFileId: string

  constructor (existingLogFileId: string) {
    super(`Log file already imported as ${existingLogFileId}`)
    this.existingLogFileId = existingLogFileId
  }
}
