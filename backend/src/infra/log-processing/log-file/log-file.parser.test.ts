import { Readable } from 'node:stream'
import { LogFileParser } from './log-file.parser'

describe('LogFileParser', () => {
  let sut: LogFileParser
  const importedAt = new Date('2024-06-01T12:00:00.000Z')

  beforeEach(() => {
    sut = new LogFileParser()
  })

  it('should stream-parse multiple lines and count failures', async () => {
    const content = [
      JSON.stringify({ level: 'INFO', message: 'ok', timestamp: '2024-01-01T00:00:00Z' }),
      '[2024-01-01T00:00:01Z] ERROR api boom',
      'unclassified line',
    ].join('\n')

    const result = await sut.parseStream(Readable.from([content]), importedAt)

    expect(result.totalLines).toBe(3)
    expect(result.failedLines).toBe(1)
    expect(result.entries).toHaveLength(3)
    expect(result.entries[0]?.level).toBe('INFO')
    expect(result.entries[1]?.level).toBe('ERROR')
    expect(result.entries[2]?.level).toBe('UNKNOWN')
  })

  it('should yield batches while iterating', async () => {
    const lines = Array.from({ length: 5 }, (_, index) =>
      JSON.stringify({ level: 'INFO', message: `line-${index}`, timestamp: '2024-01-01T00:00:00Z' })
    ).join('\n')
    const batches: number[] = []

    for await (const chunk of sut.iterateBatches(Readable.from([lines]), 2, importedAt)) {
      batches.push(chunk.batch.length)
    }

    expect(batches).toEqual([2, 2, 1])
  })
})
