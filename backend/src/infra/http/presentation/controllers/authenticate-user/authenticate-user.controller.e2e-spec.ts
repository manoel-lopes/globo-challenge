import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import { aUser } from '@tests/builders/user.builder'
import { createUser } from '@tests/helpers/domain/enterprise/users/user-requests'
import { authenticateUser } from '@tests/helpers/infra/auth/authentication-requests'

describe('AuthenticateUser (E2E)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await makeApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return 400 when email is missing', async () => {
    const response = await authenticateUser(app, {
      password: 'P@ssword1',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'The email is required',
    })
  })

  it('should return 400 when password is missing', async () => {
    const response = await authenticateUser(app, {
      email: 'test@example.com',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'The password is required',
    })
  })

  it('should return 422 when email is invalid', async () => {
    const response = await authenticateUser(app, {
      email: 'invalid-email',
      password: 'P@ssword1',
    })

    expect(response.statusCode).toBe(422)
    expect(response.body).toEqual({
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: "The 'email' must be a valid email address",
    })
  })

  it('should return 404 when user does not exist', async () => {
    const response = await authenticateUser(app, {
      email: 'nonexistent@example.com',
      password: 'P@ssword1',
    })

    expect(response.statusCode).toBe(404)
    expect(response.body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'User not found',
    })
  })

  it('should return 401 when password is incorrect', async () => {
    const userData = aUser().build()
    await createUser(app, userData)

    const response = await authenticateUser(app, {
      email: userData.email,
      password: 'WrongP@ss1',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid password',
    })
  })

  it('should return 200 and authenticate user with token', async () => {
    const userData = aUser().build()
    await createUser(app, userData)

    const response = await authenticateUser(app, {
      email: userData.email,
      password: userData.password,
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      token: expect.any(String),
    })
  })
})
