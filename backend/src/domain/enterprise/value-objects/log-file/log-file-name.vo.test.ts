import { LogFileName } from './log-file-name.vo'

describe('LogFileName', () => {
  it('should accept supported log extensions', () => {
    expect(LogFileName.create('app.log').value).toBe('app.log')
    expect(LogFileName.create('notes.TXT').value).toBe('notes.TXT')
    expect(LogFileName.isSupported('events.jsonl')).toBe(true)
  })

  it('should reject unsupported extensions and empty names', () => {
    expect(() => LogFileName.create('notes.csv')).toThrow('Unsupported file type: notes.csv')
    expect(() => LogFileName.create('')).toThrow('Log file name is required')
    expect(LogFileName.isSupported('notes.csv')).toBe(false)
  })
})
