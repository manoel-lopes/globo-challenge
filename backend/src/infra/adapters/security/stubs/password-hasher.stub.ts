import type { PasswordHasher } from '../ports/password-hasher'

export class PasswordHasherStub implements PasswordHasher {
  async hash (password: string): Promise<string> {
    return `hashed_${password}`
  }

  async compare (password: string, hashedPassword: string): Promise<boolean> {
    return hashedPassword === `hashed_${password}`
  }
}
