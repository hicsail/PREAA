import { NextResponse } from 'next/server';

const SERVICES = [
  { name: 'LangFlow', url: `${process.env.LANGFLOW_BASE_URL || 'http://localhost:7860'}/health` },
  { name: 'LiteLLM', url: `${process.env.LITELLM_BASE_URL || 'http://localhost:4000'}/health/liveliness` },
  { name: 'Langfuse', url: `${process.env.LANGFUSE_BASE_URL || 'http://localhost:3000'}/api/public/health` },
  { name: 'n8n', url: `${process.env.N8N_BASE_URL || 'http://localhost:5678'}/healthz` },
];

async function checkService(name: string, url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return { name, status: res.ok ? 'up' : 'down', statusCode: res.status, responseTime: Date.now() - start };
  } catch {
    return { name, status: 'down', statusCode: null, responseTime: Date.now() - start };
  }
}

export async function GET() {
  const results = await Promise.all(SERVICES.map((s) => checkService(s.name, s.url)));
  return NextResponse.json({ services: results, checkedAt: new Date().toISOString() });
}
