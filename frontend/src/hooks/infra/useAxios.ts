import type { AxiosRequestConfig } from 'axios'
import { client } from '@/core/infra/http/axios-client'

export function useAxios() {
  async function get<TParams = Record<string, unknown>, TResponse = void>(
    url: string,
    params?: TParams,
  ): Promise<TResponse> {
    const { data } = await client.get<TResponse>(url, { params })
    return data
  }

  async function post<TBody = Record<string, unknown>, TResponse = void>(
    url: string,
    body?: TBody | FormData,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const { data } = await client.post<TResponse>(url, body, config)
    return data
  }

  return { get, post }
}
