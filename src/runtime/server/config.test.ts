import { describe, expect, it } from 'vitest';
import { type AppConfigManifest, configSchema, resolveConnectionConfig, resolveFromEnv, validateConfig, validateManifest } from './config';

const fields = () => (configSchema as any).studioConfig.b2b.connection.fields;

describe('configSchema (the cascading manifest app release publishes)', () => {
  it('nests scope → block → section → fields', () => {
    expect(Object.keys(configSchema)).toEqual(['studioConfig']);
    expect(Object.keys((configSchema as any).studioConfig)).toEqual(['b2b']);
    expect(Object.keys(fields())).toEqual(['endpoint', 'accessToken']);
  });

  it('carries env vars, the secret flag, and the endpoint constraint as data', () => {
    expect(fields().endpoint.env).toBe('B2BSELLERS_ENDPOINT');
    expect(fields().accessToken.env).toBe('B2BSELLERS_ACCESS_TOKEN');
    expect(fields().accessToken.secret).toBe(true);
    expect(fields().endpoint.constraints).toEqual({ notEndsWith: '/store-api' });
  });
});

describe('validateManifest — minimal structural self-check (runs on push)', () => {
  it('accepts the real manifest', () => {
    expect(() => validateManifest()).not.toThrow();
  });

  it('rejects an unknown field type', () => {
    const m = { g: { fields: { x: { type: 'wat', label: 'X', required: true, env: 'X' } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/type must be one of text\|url\|secret/);
  });

  it('rejects a duplicate env var', () => {
    const m = { g: { fields: { a: { type: 'text', label: 'A', required: true, env: 'DUP' }, b: { type: 'text', label: 'B', required: true, env: 'DUP' } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/env "DUP" is already used/);
  });

  it('rejects a field with no env and no label', () => {
    const m = { g: { fields: { x: { type: 'text', required: true } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/label is required[\s\S]*env is required/);
  });

  it('rejects an uncompilable constraint pattern', () => {
    const m = { g: { fields: { x: { type: 'text', label: 'X', required: true, env: 'X', constraints: { pattern: '(' } } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/pattern is not a valid regex/);
  });
});

describe('resolveFromEnv (collects fields from anywhere in the tree)', () => {
  it('reads each field from its declared environment variable', () => {
    const cfg = resolveFromEnv(configSchema, { B2BSELLERS_ENDPOINT: 'https://shop.example.com', B2BSELLERS_ACCESS_TOKEN: 'SWSC123' } as NodeJS.ProcessEnv);
    expect(cfg).toEqual({ endpoint: 'https://shop.example.com', accessToken: 'SWSC123' });
  });

  it('yields empty strings when unset', () => {
    expect(resolveFromEnv(configSchema, {} as NodeJS.ProcessEnv)).toEqual({ endpoint: '', accessToken: '' });
  });
});

describe('validateConfig — driven by the manifest, no per-field code', () => {
  it('accepts a valid config and trims it', () => {
    expect(validateConfig({ endpoint: '  https://shop.example.com  ', accessToken: ' SWSC123 ' })).toEqual({
      endpoint: 'https://shop.example.com',
      accessToken: 'SWSC123',
    });
  });

  it('rejects a missing endpoint, naming the env var', () => {
    expect(() => validateConfig({ endpoint: '', accessToken: 'SWSC123' })).toThrow(/Shop endpoint is missing[\s\S]*B2BSELLERS_ENDPOINT/);
  });

  it('rejects a missing access token', () => {
    expect(() => validateConfig({ endpoint: 'https://shop.example.com', accessToken: '' })).toThrow(/access key[\s\S]*is missing[\s\S]*B2BSELLERS_ACCESS_TOKEN/);
  });

  it('applies the declarative notEndsWith rule (with or without a trailing slash)', () => {
    expect(() => validateConfig({ endpoint: 'https://shop.example.com/store-api', accessToken: 'SWSC123' })).toThrow(/must not end with "\/store-api"/);
    expect(() => validateConfig({ endpoint: 'https://shop.example.com/store-api/', accessToken: 'SWSC123' })).toThrow(/must not end with "\/store-api"/);
  });

  it('rejects an endpoint that is not a URL', () => {
    expect(() => validateConfig({ endpoint: 'not a url', accessToken: 'SWSC123' })).toThrow(/must be a URL/);
  });

  it('is generic over a foreign, differently-nested manifest', () => {
    const m = { scope: { block: { section: { fields: { token: { type: 'text', label: 'Token', description: '', required: true, env: 'X_TOKEN' } } } } } } as unknown as AppConfigManifest;
    expect(validateConfig({ token: 'ok' }, m, '@x/app')).toEqual({ token: 'ok' });
    expect(() => validateConfig({ token: '' }, m, '@x/app')).toThrow(/@x\/app is misconfigured[\s\S]*Token is missing/);
  });
});

describe('resolveConnectionConfig — precedence project config → env → fail', () => {
  it('lets an injected field win and fills the rest from env', () => {
    process.env.B2BSELLERS_ENDPOINT = 'https://env.example.com';
    process.env.B2BSELLERS_ACCESS_TOKEN = 'SWSC-env';
    try {
      expect(resolveConnectionConfig({ endpoint: 'https://injected.example.com' })).toEqual({
        endpoint: 'https://injected.example.com',
        accessToken: 'SWSC-env',
      });
    } finally {
      delete process.env.B2BSELLERS_ENDPOINT;
      delete process.env.B2BSELLERS_ACCESS_TOKEN;
    }
  });

  it('throws when neither project config nor env supplies a required field', () => {
    expect(() => resolveConnectionConfig({ endpoint: 'https://shop.example.com' })).toThrow(/access key[\s\S]*is missing/);
  });
});
