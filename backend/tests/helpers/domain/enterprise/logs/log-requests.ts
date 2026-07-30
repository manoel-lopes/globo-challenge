import type { INestApplication } from '@nestjs/common'
import request from 'supertest'

export async function uploadLogFile (
  app: INestApplication,
  filename: string,
  content: string | Buffer
) {
  return request(app.getHttpServer())
    .post('/log-files')
    .attach('file', Buffer.from(content), filename)
}

export async function listLogFiles (app: INestApplication, query: Record<string, unknown> = {}) {
  return request(app.getHttpServer()).get('/log-files').query(query)
}

export async function getLogFileById (app: INestApplication, id: string) {
  return request(app.getHttpServer()).get(`/log-files/${id}`)
}

export async function listLogs (app: INestApplication, query: Record<string, unknown> = {}) {
  return request(app.getHttpServer()).get('/logs').query(query)
}

export async function getLogById (app: INestApplication, id: string) {
  return request(app.getHttpServer()).get(`/logs/${id}`)
}

export async function getDashboardSummary (
  app: INestApplication,
  query: Record<string, unknown> = {}
) {
  return request(app.getHttpServer()).get('/dashboard/summary').query(query)
}

export async function getDashboardTrends (
  app: INestApplication,
  query: Record<string, unknown> = {}
) {
  return request(app.getHttpServer()).get('/dashboard/trends').query(query)
}

export async function getDashboardTopSources (
  app: INestApplication,
  query: Record<string, unknown> = {}
) {
  return request(app.getHttpServer()).get('/dashboard/top-sources').query(query)
}
