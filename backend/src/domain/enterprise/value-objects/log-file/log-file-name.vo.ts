const ALLOWED_EXTENSIONS = ['.log', '.txt', '.jsonl', '.json'] as const

export class LogFileName {
  private constructor (readonly value: string) {}

  static create (filename: string): LogFileName {
    const trimmed = filename.trim()
    if (!trimmed) {
      throw new Error('Log file name is required')
    }
    if (!this.isSupported(trimmed)) {
      throw new Error(`Unsupported file type: ${trimmed}`)
    }
    return new LogFileName(trimmed)
  }

  static isSupported (filename: string): boolean {
    const lower = filename.toLowerCase()
    return ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension))
  }

  equals (other: LogFileName): boolean {
    return this.value === other.value
  }

  toString (): string {
    return this.value
  }
}
