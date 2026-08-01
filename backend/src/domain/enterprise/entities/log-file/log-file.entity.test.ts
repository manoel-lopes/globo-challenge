import { LogFile } from './log-file.entity'

describe('LogFile', () => {
  it('should create a pending log file and stage checksum metadata', () => {
    const sut = LogFile.create({ filename: 'app.log', id: 'file-1' })

    expect(sut.status).toBe('PENDING')
    expect(sut.totalLines).toBe(0)

    sut.stage('abc', 128)

    expect(sut.checksum).toBe('abc')
    expect(sut.sizeBytes).toBe(128)
  })

  it('should transition through processing to completed with counters', () => {
    const sut = LogFile.create({ filename: 'app.log' })
    const processedAt = new Date('2024-01-01T00:00:00.000Z')

    sut.startProcessing()
    sut.recordProgress(3, 2, 1)
    sut.complete(3, 3, 1, processedAt)

    expect(sut.status).toBe('COMPLETED')
    expect(sut.totalLines).toBe(3)
    expect(sut.processedLines).toBe(3)
    expect(sut.failedLines).toBe(1)
    expect(sut.processedAt).toEqual(processedAt)
  })

  it('should reject startProcessing when already PROCESSING or COMPLETED', () => {
    const processing = LogFile.create({ filename: 'app.log' })
    processing.startProcessing()
    expect(() => processing.startProcessing()).toThrow(
      'Cannot process a completed or already processing log file'
    )

    const completed = LogFile.create({ filename: 'done.log' })
    completed.startProcessing()
    completed.complete(0, 0, 0, new Date())
    expect(() => completed.startProcessing()).toThrow(
      'Cannot process a completed or already processing log file'
    )
  })

  it('should mark failure while preserving optional counters', () => {
    const sut = LogFile.create({ filename: 'app.log' })
    sut.startProcessing()
    sut.recordProgress(5, 2, 1)

    const processedAt = new Date('2024-01-01T00:00:01.000Z')
    sut.fail(processedAt, { totalLines: 5, processedLines: 2, failedLines: 1 })

    expect(sut.status).toBe('FAILED')
    expect(sut.processedAt).toEqual(processedAt)
    expect(sut.isActiveUpload()).toBe(false)
  })

  it('should serialize to a plain snapshot for HTTP/persistence', () => {
    const sut = LogFile.create({
      filename: 'app.log',
      id: 'file-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    })

    expect(sut.toJSON()).toMatchObject({
      id: 'file-1',
      filename: 'app.log',
      status: 'PENDING',
      totalLines: 0,
      processedLines: 0,
      failedLines: 0,
    })
  })
})
