import { compare, hash } from 'bcrypt'
import { Injectable } from '@nestjs/common'
import type { PasswordHasher } from '../ports/password-hasher'

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly SALT_ROUNDS = 10

  async hash (password: string): Promise<string> {
    return hash(password, this.SALT_ROUNDS)
  }

  async compare (password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword)
  }
}
