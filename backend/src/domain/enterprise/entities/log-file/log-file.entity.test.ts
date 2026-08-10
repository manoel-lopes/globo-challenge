import { LogFile } from './log-file.entity'

describe('LogFile', () => {
  it('should create a pending log file and stage checksum metadata', () => {
    let sut = LogFile.create(
      {
        filename: 'app.log',
        status: 'PENDING',
        checksum: null,
        sizeBytes: null,
        totalLines: 0,
        processedLines: 0,
        failedLines: 0,
        processedAt: null,
      },
      'file-1'
    )

    expect(sut.status).toBe('PENDING')
    expect(sut.totalLines).toBe(0)

    sut = LogFile.create({ ...sut.toJSON(), checksum: 'abc', sizeBytes: 128 }, sut.id)

    expect(sut.checksum).toBe('abc')
    expect(sut.sizeBytes).toBe(128)
  })

  it('should transition through processing to completed with counters', () => {
    let sut = LogFile.create({
      filename: 'app.log',
      status: 'PENDING',
      checksum: null,
      sizeBytes: null,
      totalLines: 0,
      processedLines: 0,
      failedLines: 0,
      processedAt: null,
    })
    const processedAt = new Date('2024-01-01T00:00:00.000Z')

    sut = LogFile.create({ ...sut.toJSON(), status: 'PROCESSING' }, sut.id)
    sut = LogFile.create({ ...sut.toJSON(), totalLines: 3, processedLines: 2, failedLines: 1 }, sut.id)
    sut = LogFile.create(
      {
        ...sut.toJSON(),
        status: 'COMPLETED',
        totalLines: 3,
        processedLines: 3,
        failedLines: 1,
        processedAt,
      },
      sut.id
    )

    expect(sut.status).toBe('COMPLETED')
    expect(sut.totalLines).toBe(3)
    expect(sut.processedLines).toBe(3)
    expect(sut.failedLines).toBe(1)
    expect(sut.processedAt).toEqual(processedAt)
  })

  it('should preserve id across transitions', () => {
    const sut = LogFile.create(
      {
        filename: 'app.log',
        status: 'PENDING',
        checksum: null,
        sizeBytes: null,
        totalLines: 0,
        processedLines: 0,
        failedLines: 0,
        processedAt: null,
      },
      'file-1'
    )
    const staged = LogFile.create({ ...sut.toJSON(), checksum: 'abc', sizeBytes: 128 }, sut.id)
    const processing = LogFile.create({ ...staged.toJSON(), status: 'PROCESSING' }, staged.id)

    expect(staged.id).toBe(sut.id)
    expect(processing.id).toBe(sut.id)
  })

  it('should mark failure while preserving optional counters', () => {
    let sut = LogFile.create({
      filename: 'app.log',
      status: 'PENDING',
      checksum: null,
      sizeBytes: null,
      totalLines: 0,
      processedLines: 0,
      failedLines: 0,
      processedAt: null,
    })
    sut = LogFile.create({ ...sut.toJSON(), status: 'PROCESSING' }, sut.id)
    sut = LogFile.create({ ...sut.toJSON(), totalLines: 5, processedLines: 2, failedLines: 1 }, sut.id)

    const processedAt = new Date('2024-01-01T00:00:01.000Z')
    sut = LogFile.create(
      {
        ...sut.toJSON(),
        status: 'FAILED',
        processedAt,
      },
      sut.id
    )

    expect(sut.status).toBe('FAILED')
    expect(sut.processedAt).toEqual(processedAt)
    expect(sut.status === 'PENDING' || sut.status === 'PROCESSING').toBe(false)
  })

  it('should serialize to a plain snapshot for HTTP/persistence', () => {
    const sut = LogFile.create(
      {
        filename: 'app.log',
        status: 'PENDING',
        checksum: null,
        sizeBytes: null,
        totalLines: 0,
        processedLines: 0,
        failedLines: 0,
        processedAt: null,
      },
      'file-1'
    )

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
