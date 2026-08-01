import { faker } from '@faker-js/faker'
import type { Page } from '@playwright/test'
import type { LogFile } from '@/core/domain/entities/log-file'
import type { MockState } from '../mock-api'
import { paginateOffset } from '../selectors'

const PROCESSING_DELAY_MS = 400
const SETTLE_DELAY_MS = 900

interface ParsedUpload {
  filename: string
  size: number
}

function parseMultipartUpload(body: Buffer | null): ParsedUpload | null {
  if (!body) return null
  const text = body.toString('latin1')
  const nameMatch = /name="file";\s*filename="([^"]*)"/.exec(text)
  if (!nameMatch) return null

  const headerEnd = text.indexOf('\r\n\r\n', nameMatch.index)
  if (headerEnd === -1) return null
  const contentStart = headerEnd + 4
  const boundaryMatch = /\r\n--/.exec(text.slice(contentStart))
  const contentEnd = boundaryMatch ? contentStart + boundaryMatch.index : text.length

  return { filename: nameMatch[1], size: Math.max(0, contentEnd - contentStart) }
}

function createUploadedLogFile(state: MockState, filename: string, sizeBytes: number): LogFile {
  const id = faker.string.uuid()
  const now = new Date().toISOString()
  const shouldFail = filename.toLowerCase().includes('fail')
  const totalLines = shouldFail ? 40 : 80

  const file: LogFile = {
    id,
    filename,
    status: 'PENDING',
    checksum: null,
    sizeBytes,
    totalLines,
    processedLines: 0,
    failedLines: 0,
    processedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  state.logFiles = [file, ...state.logFiles]

  setTimeout(() => {
    state.logFiles = state.logFiles.map((item) =>
      item.id === id ? { ...item, status: 'PROCESSING', updatedAt: new Date().toISOString() } : item,
    )
  }, PROCESSING_DELAY_MS)

  setTimeout(() => {
    const finishedAt = new Date().toISOString()
    state.logFiles = state.logFiles.map((item) =>
      item.id === id
        ? shouldFail
          ? { ...item, status: 'FAILED', processedLines: 0, failedLines: totalLines, processedAt: finishedAt, updatedAt: finishedAt }
          : { ...item, status: 'COMPLETED', processedLines: totalLines, failedLines: 0, processedAt: finishedAt, updatedAt: finishedAt }
        : item,
    )
  }, SETTLE_DELAY_MS)

  return file
}

export async function registerLogFileHandlers(page: Page, state: MockState): Promise<void> {
  await page.route(/\/log-files(\?[^/]*)?$/, async (route) => {
    const request = route.request()
    const method = request.method()

    if (method === 'GET') {
      const url = new URL(request.url())
      const pageNumber = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
      const pageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '10', 10)
      const order = (url.searchParams.get('order') as 'asc' | 'desc' | null) ?? 'desc'
      await route.fulfill({ json: paginateOffset(state.logFiles, pageNumber, pageSize, order) })
      return
    }

    if (method === 'POST') {
      const parsed = parseMultipartUpload(await request.postDataBuffer())
      if (!parsed) {
        await route.fulfill({
          status: 400,
          json: { statusCode: 400, message: 'A file is required.', error: 'Bad Request' },
        })
        return
      }
      await route.fulfill({
        status: 201,
        json: createUploadedLogFile(state, parsed.filename, parsed.size),
      })
      return
    }

    await route.fallback()
  })

  await page.route(/\/log-files\/[^/?]+(\?[^/]*)?$/, async (route) => {
    const request = route.request()
    if (request.method() !== 'GET') {
      await route.fallback()
      return
    }
    const id = new URL(request.url()).pathname.split('/').pop()
    const file = state.logFiles.find((item) => item.id === id)
    if (!file) {
      await route.fulfill({
        status: 404,
        json: { statusCode: 404, message: 'Log file not found.', error: 'Not Found' },
      })
      return
    }
    await route.fulfill({ json: file })
  })
}
