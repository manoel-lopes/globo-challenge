import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'

const axiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
})

export const client = axiosInstance

export type RequestConfig<TData = unknown> = Omit<AxiosRequestConfig<TData>, 'data'> & {
  data?: TData | FormData
}

export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>
