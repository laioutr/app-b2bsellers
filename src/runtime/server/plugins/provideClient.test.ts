import { describe, expect, it, vi } from 'vitest';
import { CLIENT_CONTEXT_KEY } from '../const';

const client = { invoke: vi.fn() };
const useB2bSellersClient = vi.fn(() => client);

vi.mock('../client/useB2bSellersClient', () => ({ useB2bSellersClient: (event: unknown) => useB2bSellersClient(event as never) }));

const { default: plugin } = await import('./provideClient');

/** Stand-in for the Nitro app: records the `request` hook the plugin installs. */
const nitro = () => {
  let onRequest: ((event: unknown) => void) | undefined;
  return {
    app: { hooks: { hook: (name: string, fn: (event: unknown) => void) => { if (name === 'request') onRequest = fn; } } },
    fire: (event: unknown) => onRequest?.(event),
  };
};

describe('the client offered through the request context', () => {
  it('puts a factory on the event, so an app that cannot reach the auto-import still finds the shop', () => {
    const { app, fire } = nitro();
    (plugin as (app: unknown) => void)(app);
    const event = { context: {} as Record<string, unknown> };

    fire(event);

    expect(typeof event.context[CLIENT_CONTEXT_KEY]).toBe('function');
    expect((event.context[CLIENT_CONTEXT_KEY] as () => unknown)()).toBe(client);
  });

  it('builds nothing until asked — a request that never talks to the shop pays no cost', () => {
    const { app, fire } = nitro();
    (plugin as (app: unknown) => void)(app);
    useB2bSellersClient.mockClear();

    fire({ context: {} as Record<string, unknown> });

    expect(useB2bSellersClient).not.toHaveBeenCalled();
  });

  it('builds the client for the event it was handed, so the session cookie is the caller’s', () => {
    const { app, fire } = nitro();
    (plugin as (app: unknown) => void)(app);
    const event = { context: {} as Record<string, unknown>, marker: 'this request' };
    useB2bSellersClient.mockClear();

    fire(event);
    (event.context[CLIENT_CONTEXT_KEY] as () => unknown)();

    expect(useB2bSellersClient).toHaveBeenCalledWith(event);
  });
});
