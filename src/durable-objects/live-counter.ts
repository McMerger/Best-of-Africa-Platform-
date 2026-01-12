// ═══════════════════════════════════════════════════════════════════════════════
// LIVE COUNTER DURABLE OBJECT
// Real-time counters for live dashboard metrics
// ═══════════════════════════════════════════════════════════════════════════════

export class LiveCounter {
    private state: DurableObjectState;
    private count: number = 0;
    private lastReset: number = Date.now();

    constructor(state: DurableObjectState) {
        this.state = state;

        // Load persisted count
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get<{ count: number; lastReset: number }>('data');
            if (stored) {
                this.count = stored.count;
                this.lastReset = stored.lastReset;
            }

            // Reset daily
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            if (now - this.lastReset > dayMs) {
                this.count = 0;
                this.lastReset = now;
                await this.persist();
            }
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        switch (url.pathname) {
            case '/increment':
                this.count++;
                await this.persist();
                return new Response(JSON.stringify({ count: this.count }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            case '/get':
                return new Response(JSON.stringify({
                    count: this.count,
                    last_reset: new Date(this.lastReset).toISOString(),
                }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            case '/reset':
                this.count = 0;
                this.lastReset = Date.now();
                await this.persist();
                return new Response(JSON.stringify({ count: 0 }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            default:
                return new Response('Not found', { status: 404 });
        }
    }

    private async persist(): Promise<void> {
        await this.state.storage.put('data', {
            count: this.count,
            lastReset: this.lastReset,
        });
    }
}
