import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/agents', () => {
  it('should return a list of agents', async () => {
    const request = new NextRequest('http://localhost/api/agents')
    const response = await GET(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toHaveProperty('data')
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('should filter agents by query parameter', async () => {
    const request = new NextRequest('http://localhost/api/agents?q=whatsapp')
    const response = await GET(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toHaveProperty('data')
    expect(json.data.every((agent: any) => agent.name.toLowerCase().includes('whatsapp'))).toBe(true)
  })

  it('should handle invalid query parameters', async () => {
    const request = new NextRequest('http://localhost/api/agents?page=abc')
    const response = await GET(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json).toHaveProperty('error')
  })
})
