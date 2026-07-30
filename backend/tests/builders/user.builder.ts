import { faker } from '@faker-js/faker'

export interface UserTestData {
  id?: string
  name?: unknown
  email?: unknown
  password?: unknown
}

export class UserBuilder {
  private userData: UserTestData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'P@ssword1',
  }

  withName (name?: unknown): UserBuilder {
    this.userData.name = name
    return this
  }

  withEmail (email?: unknown): UserBuilder {
    this.userData.email = email
    return this
  }

  withPassword (password?: unknown): UserBuilder {
    this.userData.password = password
    return this
  }

  build (): UserTestData {
    const result: UserTestData = {}
    for (const [key, value] of Object.entries(this.userData)) {
      if (value !== undefined) {
        result[key as keyof UserTestData] = value
      }
    }
    return result
  }
}

export const aUser = (): UserBuilder => new UserBuilder()
