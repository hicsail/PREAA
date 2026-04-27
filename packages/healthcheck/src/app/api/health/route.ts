import { getLastHealthStatus } from '@/lib/healthPoller';
import { NextResponse } from 'next/server';

export async function GET() {
    const state = getLastHealthStatus();

    if (!state) {
        return NextResponse.json({ error: 'Health check not yet available' }, { status: 503 });
    }

    const allHealthy = Object.values(state).every((s) => s.status === 'healthy');

    return NextResponse.json({
        overall: allHealthy ? 'healthy' : 'degraded',
        services: state
    });
}
