const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value)
}

export function formatPercent(ratio: number): string {
  return PERCENT_FORMATTER.format(ratio)
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1)
  const value = bytes / 1024 ** exponent
  const precision = exponent === 0 ? 0 : 1
  return `${value.toFixed(precision)} ${BYTE_UNITS[exponent]}`
}
