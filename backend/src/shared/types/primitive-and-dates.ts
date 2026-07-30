type PrimitiveAndDateKeys<T> = {
  [K in keyof T]: T[K] extends object | null | undefined
    ? T[K] extends Date | null | undefined
      ? K
      : never
    : K
}[keyof T]

export type PrimitiveAndDates<T> = Pick<T, PrimitiveAndDateKeys<T>>
