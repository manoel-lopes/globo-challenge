import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'

describe('husky verification', () => {
  it('is a placeholder used only to verify the pre-commit hook', () => {
    expect(typeof randomUUID()).toBe('string')
  })
})
