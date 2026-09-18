import { describe, expect, it } from 'vitest';
import { type AppConfigManifest, configSchema, envVarFor, resolveConnectionConfig, resolveFromEnv, validateConfig, validateManifest } from './config';

const fields = () => (configSchema as any).studioConfig.b2b.connection.fields;

describe('configSchema (the cascading manifest app release publishes)', () => {
  it('nests scope → block → section → fields', () => {
    expect(Object.keys(configSchema)).toEqual(['studioConfig']);
    expect(Object.keys((configSchema as any).studioConfig)).toEqual(['b2b']);
    expect(Object.keys(fields())).toEqual(['endpoint', 'accessToken']);
  });

  it('carries the secret flag and the endpoint constraint as data, and no env name', () => {
    expect(fields().accessToken.secret).toBe(true);
    expect(fields().endpoint.constraints).toEqual({ notEndsWith: '/store-api' });
    expect(fields().endpoint.env).toBeUndefined();
    expect(fields().accessToken.env).toBeUndefined();
  });
});

describe('envVarFor — the fallback var name, derived by convention (not in the manifest)', () => {
  it('prefixes and upper-snake-cases the field key', () => {
    expect(envVarFor('endpoint')).toBe('B2BSELLERS_ENDPOINT');
    expect(envVarFor('accessToken')).toBe('B2BSELLERS_ACCESS_TOKEN');
  });
});

describe('validateManifest — minimal structural self-check (runs on push)', () => {
  it('accepts the real manifest', () => {
    expect(() => validateManifest()).not.toThrow();
  });

  it('rejects an unknown field type', () => {
    const m = { g: { fields: { x: { type: 'wat', label: 'X', required: true } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/type must be one of text\|url\|secret/);
  });

  it('rejects a field key used twice across the tree', () => {
    const m = { g: { a: { fields: { dup: { type: 'text', label: 'A', required: true } } }, b: { fields: { dup: { type: 'text', label: 'B', required: true } } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/duplicate field key/);
  });

  it('rejects a field with no label', () => {
    const m = { g: { fields: { x: { type: 'text', required: true } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/label is required/);
  });

  it('rejects an uncompilable constraint pattern', () => {
    const m = { g: { fields: { x: { type: 'text', label: 'X', required: true, constraints: { pattern: '(' } } } } } as unknown as AppConfigManifest;
    expect(() => validateManifest(m)).toThrow(/pattern is not a valid regex/);
  });
});

describe('resolveFromEnv (derived var names, collected from anywhere in the tree)', () => {
  it('reads each field from its derived environment variable', () => {
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

  it('rejects a missing endpoint, naming the derived env var', () => {
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
    const m = { scope: { block: { section: { fields: { token: { type: 'text', label: 'Token', description: '', required: true } } } } } } as unknown as AppConfigManifest;
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
