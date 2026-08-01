import { LogEntry } from './log-entry.entity'

describe('LogEntry', () => {
  it('should create an immutable classified entry', () => {
    const sut = LogEntry.create({
      logFileId: 'file-1',
      level: 'ERROR',
      timestamp: new Date('2024-01-01T10:00:00.000Z'),
      source: 'api',
      message: 'boom',
      rawLine: 'ERROR boom',
      metadata: { requestId: 'r-1' },
    })

    expect(sut.level).toBe('ERROR')
    expect(sut.source).toBe('api')
    expect(sut.toJSON()).toMatchObject({
      logFileId: 'file-1',
      level: 'ERROR',
      message: 'boom',
      metadata: { requestId: 'r-1' },
    })
  })
})
