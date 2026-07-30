export class FileTooLargeError extends Error {
  constructor (maxSize: number) {
    super(`File exceeds maximum allowed size of ${maxSize} bytes`)
  }
}
