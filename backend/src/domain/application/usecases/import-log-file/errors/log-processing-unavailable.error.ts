export class LogProcessingUnavailableError extends Error {
  constructor (cause?: unknown) {
    super('Log file processing queue is temporarily unavailable')
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}
