import { LogClassifierRegistry } from './log-classifier.registry'

describe('LogClassifierRegistry', () => {
  let sut: LogClassifierRegistry
  const importedAt = new Date('2024-06-01T12:00:00.000Z')

  beforeEach(() => {
    sut = new LogClassifierRegistry()
  })

  it('should classify structured JSON lines', () => {
    const rawLine = JSON.stringify({
      level: 'error',
      timestamp: '2024-01-01T10:00:00.000Z',
      service: 'api-gateway',
      message: 'request failed',
      requestId: 'abc-123',
    })

    const result = sut.classify(rawLine, importedAt)

    expect(result).toEqual({
      level: 'ERROR',
      timestamp: new Date('2024-01-01T10:00:00.000Z'),
      source: 'api-gateway',
      message: 'request failed',
      metadata: { requestId: 'abc-123' },
      rawLine,
      failed: false,
    })
  })

  it('should classify bracketed plain-text lines', () => {
    const rawLine = '[2024-01-01T10:00:00Z] ERROR auth-service Invalid token'

    const result = sut.classify(rawLine, importedAt)

    expect(result.level).toBe('ERROR')
    expect(result.timestamp).toEqual(new Date('2024-01-01T10:00:00.000Z'))
    expect(result.source).toBe('auth-service')
    expect(result.message).toBe('Invalid token')
    expect(result.failed).toBe(false)
  })

  it('should classify syslog-like lines', () => {
    const rawLine = '<34>2024-01-01T10:00:00Z host1 nginx: connection refused'

    const result = sut.classify(rawLine, importedAt)

    expect(result.level).toBe('FATAL')
    expect(result.source).toBe('nginx')
    expect(result.message).toBe('connection refused')
    expect(result.metadata).toEqual({ priority: 34 })
    expect(result.failed).toBe(false)
  })

  it('should fall back to level keyword heuristic', () => {
    const rawLine = 'something went wrong: WARN disk almost full'

    const result = sut.classify(rawLine, importedAt)

    expect(result.level).toBe('WARN')
    expect(result.timestamp).toEqual(importedAt)
    expect(result.message).toBe(rawLine)
    expect(result.failed).toBe(false)
  })

  it('should default to UNKNOWN when no level is found', () => {
    const rawLine = 'plain text without a level keyword'

    const result = sut.classify(rawLine, importedAt)

    expect(result.level).toBe('UNKNOWN')
    expect(result.failed).toBe(true)
    expect(result.rawLine).toBe(rawLine)
  })

  it('should mark empty lines as failed UNKNOWN', () => {
    const result = sut.classify('   ', importedAt)

    expect(result.level).toBe('UNKNOWN')
    expect(result.failed).toBe(true)
  })
})
