import { FileSizeLimit } from './file-size-limit.vo'

describe('FileSizeLimit', () => {
  it('should detect when a size exceeds the limit', () => {
    const sut = FileSizeLimit.create(1024)

    expect(sut.isExceededBy(1024)).toBe(false)
    expect(sut.isExceededBy(1025)).toBe(true)
  })

  it('should reject non-positive limits', () => {
    expect(() => FileSizeLimit.create(0)).toThrow('File size limit must be a positive number')
    expect(() => FileSizeLimit.create(-1)).toThrow('File size limit must be a positive number')
  })
})
