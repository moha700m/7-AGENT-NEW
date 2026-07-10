const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '')
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? JSON.stringify(error) : '')
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '')
  },
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
    }
  },
}

export async function logApiCall(
  method: string,
  path: string,
  status: number,
  duration: number
) {
  logger.info('API Call', {
    method,
    path,
    status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  })
}
