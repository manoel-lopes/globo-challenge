import type { INestApplication } from '@nestjs/common'
import request from 'supertest'

export type CreateUserData = {
  name?: unknown
  email?: unknown
  password?: unknown
}

export async function createUser (app: INestApplication, userData: CreateUserData) {
  const response = await request(app.getHttpServer()).post('/users').send(userData)
  return response
}
