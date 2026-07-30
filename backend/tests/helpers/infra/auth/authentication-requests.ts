import type { INestApplication } from '@nestjs/common'
import request from 'supertest'

type AuthCredentials = {
  email?: unknown
  password?: unknown
}

export async function authenticateUser (app: INestApplication, credentials: AuthCredentials) {
  const response = await request(app.getHttpServer()).post('/auth').send(credentials)
  return response
}
