import { healthLivelinessHealthLivenessGet } from '@/app/lib/client-litellm/sdk.gen';
import { healthHealthGet } from '@/app/lib/client-langflow/sdk.gen';
import { healthHealth } from '@/app/lib/client-langfuse/sdk.gen';
import { litellmClient, langflowClient, langfuseClient } from '@/app/lib/container';

export type ServiceStatus = {
    status: 'healthy' | 'unhealthy';
    latencyMs: number | null;
    checkedAt: string;
};

export type HealthState = {
    langflow: ServiceStatus;
    litellm: ServiceStatus;
    n8n: ServiceStatus;
    langfuse: ServiceStatus;
};

declare global {
  // eslint-disable-next-line no-var
  var __healthState: HealthState | null;
}

global.__healthState = global.__healthState ?? null;

async function checkWithClient(fn: () => Promise<{ response: Response }>): Promise<ServiceStatus> {
    const start = Date.now();
    try {
        const { response } = await fn();
        return {
        status: response.ok ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
        checkedAt: new Date().toISOString()
        };
    } catch {
        return { status: 'unhealthy', latencyMs: null, checkedAt: new Date().toISOString() };
    }
}

async function checkN8n(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
        const res = await fetch(`${process.env.N8N_BASE_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
        return {
        status: res.ok ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
        checkedAt: new Date().toISOString()
        };
    } catch {
        return { status: 'unhealthy', latencyMs: null, checkedAt: new Date().toISOString() };
    }
}

async function poll() {
    try {
        const [langflow, litellm, n8n, langfuse] = await Promise.all([
        checkWithClient(() => healthHealthGet({ client: langflowClient })),
        checkWithClient(() => healthLivelinessHealthLivenessGet({ client: litellmClient as any })),
        checkN8n(),
        checkWithClient(() => healthHealth({ client: langfuseClient as any }))
        ]);

        global.__healthState = { langflow, litellm, n8n, langfuse };
        console.log('poll completed', JSON.stringify(global.__healthState));
    } catch (err) {
        console.error('poll failed', err);
    }
}

export function getLastHealthStatus(): HealthState | null {
    return global.__healthState;
}

export function startPoller() {
    const interval = parseInt(process.env.POLL_INTERVAL_MS ?? '30000', 10);
    poll();
    setInterval(poll, interval);
}
