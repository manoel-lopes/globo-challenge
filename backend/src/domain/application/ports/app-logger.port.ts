export type AppLogger = {
  log(message: string): void
  error(message: string): void
}

export const noopAppLogger: AppLogger = {
  log () {},
  error () {},
}
