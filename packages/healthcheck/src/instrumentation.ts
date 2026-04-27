export async function register() {
    console.log('instrumentation register called, runtime:', process.env.NEXT_RUNTIME);
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { startPoller } = await import('./lib/healthPoller');
        startPoller();
    }
}
