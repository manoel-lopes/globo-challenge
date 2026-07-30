export class MissingLogFileError extends Error {
  constructor () {
    super('Log file is required')
  }
}
