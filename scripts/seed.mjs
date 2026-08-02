#!/usr/bin/env node
const API_URL = process.env.API_URL ?? 'http://localhost:3333'
const READY_RETRIES = 30
const READY_DELAY_MS = 2000

const LEVEL_WEIGHTS = [
  ['INFO', 55],
  ['WARN', 20],
  ['ERROR', 15],
  ['DEBUG', 7],
  ['FATAL', 3],
]

const MESSAGES = {
  INFO: [
    'Request completed successfully',
    'User session started',
    'Cache warmed up',
    'Scheduled job finished',
    'Health check passed',
    'Configuration reloaded',
  ],
  WARN: [
    'Response time above threshold',
    'Retrying request after timeout',
    'Deprecated endpoint used',
    'Connection pool near capacity',
    'Rate limit approaching',
  ],
  ERROR: [
    'Failed to connect to upstream service',
    'Unhandled exception in request handler',
    'Database query timed out',
    'Validation failed for incoming payload',
    'Failed to acquire lock',
  ],
  DEBUG: [
    'Entering handler with params',
    'Cache lookup result',
    'Dispatching internal event',
    'Computed intermediate value',
  ],
  FATAL: [
    'Process aborted due to unrecoverable error',
    'Out of memory, shutting down',
    'Critical dependency unavailable, exiting',
  ],
}

function pickLevel() {
  const total = LEVEL_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [level, weight] of LEVEL_WEIGHTS) {
    if (roll < weight) return level
    roll -= weight
  }
  return LEVEL_WEIGHTS[0][0]
}

function pickMessage(level) {
  const options = MESSAGES[level]
  return options[Math.floor(Math.random() * options.length)]
}

function buildLogFile(source, lineCount, spanHours) {
  const now = Date.now()
  const timestamps = Array.from({ length: lineCount }, () => now - Math.random() * spanHours * 60 * 60 * 1000)
    .sort((a, b) => a - b)

  const lines = timestamps.map((ms) => {
    const level = pickLevel()
    const message = pickMessage(level)
    return `[${new Date(ms).toISOString()}] ${level} ${source} ${message}`
  })

  return lines.join('\n') + '\n'
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitUntilReady() {
  for (let attempt = 1; attempt <= READY_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_URL}/log-files?page=1&pageSize=1`)
      if (response.ok) return response
    } catch {}
    console.log(`[seed] waiting for API at ${API_URL} (attempt ${attempt}/${READY_RETRIES})…`)
    await sleep(READY_DELAY_MS)
  }
  throw new Error(`API at ${API_URL} did not become ready in time`)
}

async function alreadySeeded() {
  const response = await waitUntilReady()
  const body = await response.json()
  return (body.totalItems ?? 0) > 0
}

async function uploadLogFile(filename, content) {
  const form = new FormData()
  form.append('file', new Blob([content], { type: 'text/plain' }), filename)

  const response = await fetch(`${API_URL}/log-files`, {
    method: 'POST',
    body: form,
  })

  if (response.status === 409) {
    console.log(`[seed] ${filename}: already exists (409), skipping`)
    return
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to upload ${filename}: ${response.status} ${body}`)
  }

  const body = await response.json()
  console.log(`[seed] ${filename}: uploaded as ${body.id} (status ${body.status})`)
}

async function main() {
  if (await alreadySeeded()) {
    console.log('[seed] database already has log files, skipping seed')
    return
  }

  const files = [
    ['api-gateway.log', buildLogFile('api-gateway', 60, 72)],
    ['payments-service.log', buildLogFile('payments-service', 55, 60)],
    ['worker.log', buildLogFile('worker', 45, 48)],
  ]

  for (const [filename, content] of files) {
    await uploadLogFile(filename, content)
  }

  console.log('[seed] done')
}

main().catch((error) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
