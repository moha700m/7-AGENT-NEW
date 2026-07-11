import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getOpenAI } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

const runSchema = z.object({ prompt: z.string().trim().min(1).max(4000) })

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = runSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })
  const { slug } = await params
  const agent = await prisma.agent.findFirst({ where: { slug, status: 'PUBLISHED' } })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  const allowed = session.user.role === 'ADMIN' || agent.ownerId === session.user.id || await prisma.subscription.count({ where: { userId: session.user.id, agentId: agent.id, status: 'ACTIVE' } }) > 0
  if (!allowed) return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
  const openai = getOpenAI()
  if (!openai) return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 })
  const model = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini'
  const run = await prisma.agentRun.create({ data: { userId: session.user.id, agentId: agent.id, model, prompt: parsed.data.prompt } })
  try {
    const response = await openai.responses.create({ model, instructions: `أنت ${agent.nameAr}. مهمتك: ${agent.description}\nأجب بالعربية بوضوح، ولا تدّع تنفيذ إجراءات خارج المحادثة.`, input: parsed.data.prompt, max_output_tokens: 800 })
    await prisma.agentRun.update({ where: { id: run.id }, data: {
      status: 'COMPLETE', output: response.output_text, responseId: response.id,
      inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens, totalTokens: response.usage?.total_tokens,
    } })
    return NextResponse.json({ id: run.id, output: response.output_text })
  } catch {
    await prisma.agentRun.update({ where: { id: run.id }, data: { status: 'ERROR', errorMessage: 'OpenAI request failed' } })
    return NextResponse.json({ id: run.id, error: 'تعذر تشغيل الوكيل حالياً' }, { status: 502 })
  }
}
