export interface CursorPage<TItem> {
  items: TItem[]
  nextCursor: string | null
  limit: number
}
