export interface OffsetPage<TItem> {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  items: TItem[]
  order: 'asc' | 'desc'
}
