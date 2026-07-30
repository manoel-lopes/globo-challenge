export class UnsupportedFileTypeError extends Error {
  constructor (filename: string) {
    super(`Unsupported file type: ${filename}`)
  }
}
