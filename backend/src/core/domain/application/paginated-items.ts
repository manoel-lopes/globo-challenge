export type PaginatedItems<Item> = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  items: Item[]
  order: 'asc' | 'desc'
}
