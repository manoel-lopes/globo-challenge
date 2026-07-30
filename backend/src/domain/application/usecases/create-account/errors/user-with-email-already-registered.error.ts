export class UserWithEmailAlreadyRegisteredError extends Error {
  constructor () {
    super('User with email already registered')
  }
}
