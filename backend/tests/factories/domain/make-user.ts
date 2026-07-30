import type { UserProps } from '@/domain/enterprise/entities/user.entity'
import { faker } from '@faker-js/faker'

export function makeUserData (override: Partial<UserProps> = {}): UserProps {
  const user: UserProps = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    ...override,
  }
  return user
}
