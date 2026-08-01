export class ChecksumConflictError extends Error {
  readonly existingLogFileId?: string

  constructor (existingLogFileId?: string) {
    super('Checksum already exists for an active log file')
    this.existingLogFileId = existingLogFileId
  }
}
