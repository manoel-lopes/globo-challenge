export class FileSizeLimit {
  private constructor (private readonly maxBytes: number) {
    if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
      throw new Error('File size limit must be a positive number')
    }
  }

  static create (maxBytes: number): FileSizeLimit {
    return new FileSizeLimit(maxBytes)
  }

  isExceededBy (sizeBytes: number): boolean {
    return sizeBytes > this.maxBytes
  }

  equals (other: FileSizeLimit): boolean {
    return this.maxBytes === other.maxBytes
  }
}
