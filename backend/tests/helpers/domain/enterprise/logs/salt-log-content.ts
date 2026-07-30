export function saltLogContent (content: string, salt: string): string {
  if (content.includes('plain line without level')) {
    return content.replace(
      'plain line without level',
      `plain line without level ${salt}`
    )
  }
  return `${content.trimEnd()}\n# salt ${salt}\n`
}
