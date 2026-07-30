type Resource = 'LogFile' | 'LogEntry'

export class ResourceNotFoundError extends Error {
  constructor (resource: Resource) {
    super(`${resource} not found`)
  }
}
