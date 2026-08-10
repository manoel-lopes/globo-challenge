type NonMethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown
    ? never
    : K
}[keyof T]

export type Props<T> = Omit<Pick<T, NonMethodKeys<T>>, 'id' | 'createdAt' | 'updatedAt'>
