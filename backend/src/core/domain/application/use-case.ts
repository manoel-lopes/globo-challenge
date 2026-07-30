export type Request = Record<string, unknown>
export type Response = unknown

export type UseCase = {
  execute(req: Request): Promise<Response>
}
