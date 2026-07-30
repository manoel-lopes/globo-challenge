export class DuplicateLogFileError extends Error {
  constructor (public readonly existingLogFileId: string) {
    super(`Log file already imported as ${existingLogFileId}`)
  }
}
