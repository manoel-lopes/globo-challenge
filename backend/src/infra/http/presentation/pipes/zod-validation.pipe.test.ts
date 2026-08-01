import { z } from 'zod'
import { BadRequestException, UnprocessableEntityException } from '@nestjs/common'
import { ZodValidationPipe } from './zod-validation.pipe'

describe('ZodValidationPipe', () => {
  it('should throw BadRequestException when a required field is missing', () => {
    const sut = new ZodValidationPipe(
      z.object({
        name: z.string(),
      })
    )

    expect(() => sut.transform({})).toThrow(BadRequestException)
    expect(() => sut.transform({})).toThrow(/is required/)
  })

  it('should throw UnprocessableEntityException for invalid format', () => {
    const sut = new ZodValidationPipe(
      z.object({
        id: z.uuid(),
      })
    )

    expect(() => sut.transform({ id: 'not-a-uuid' })).toThrow(
      UnprocessableEntityException
    )
  })

  it('should return parsed value on success', () => {
    const sut = new ZodValidationPipe(
      z.object({
        name: z.string(),
      })
    )

    const result = sut.transform({ name: 'ok' })

    expect(result).toEqual({ name: 'ok' })
  })
})
