import { parseTimestamp } from './log-level.helper'

describe('parseTimestamp', () => {
  const importedAt = new Date('2026-07-30T12:00:00.000Z')

  it('should infer the current year for a year-less syslog timestamp in the past', () => {
    const result = parseTimestamp('Mar 15 08:30:00', importedAt)

    expect(result.toISOString()).toBe('2026-03-15T08:30:00.000Z')
  })

  it('should roll back one year when the year-less timestamp would be in the future', () => {
    const result = parseTimestamp('Dec 31 23:59:59', importedAt)

    expect(result.toISOString()).toBe('2025-12-31T23:59:59.000Z')
  })

  it('should leave ISO timestamps unchanged', () => {
    const result = parseTimestamp('2024-03-15T08:30:00.000Z', importedAt)

    expect(result.toISOString()).toBe('2024-03-15T08:30:00.000Z')
  })

  it('should parse epoch millis', () => {
    const result = parseTimestamp(1710491400000, importedAt)

    expect(result.toISOString()).toBe('2024-03-15T08:30:00.000Z')
  })

  it('should return the fallback for unparseable values', () => {
    expect(parseTimestamp('not-a-timestamp', importedAt)).toEqual(importedAt)
    expect(parseTimestamp('', importedAt)).toEqual(importedAt)
  })
})
