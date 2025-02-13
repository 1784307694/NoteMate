import useTokenStore from "@/stores/token"
import { resolveResError } from "./helpers"

// 请求拦截器
export function reqResolve(config: any) {
  if (config.noNeedToken) {
    return config
  }

  const token = useTokenStore().token
  if (token) {
    config.headers.token = config.headers.token || token
  }
  return config
}
// 请求拦截器错误
export function reqReject(error: any) {
  return Promise.reject(error)
}

// 响应拦截器
export function resResolve(response: any) {
  const { data, status, statusText } = response
  if (data?.code !== 200) {
    const code = data?.code ?? status
    /** 根据code处理对应的操作，并返回处理后的message */
    const message = resolveResError(code, data?.msg ?? statusText)
    return Promise.reject({ code, message, error: data || response })
  }
  return Promise.resolve(data)
}
// 响应拦截器错误
export function resReject(error: any) {
  return Promise.reject(error)
}
