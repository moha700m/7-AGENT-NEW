import OpenAI from 'openai'

let openaiClient: OpenAI | null | undefined

export function getOpenAI() {
  if (openaiClient !== undefined) return openaiClient
  const apiKey = process.env.OPENAI_API_KEY
  openaiClient = apiKey ? new OpenAI({ apiKey }) : null
  return openaiClient
}
