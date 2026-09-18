import { describe, expect, it } from 'vitest';
import { configSchema, resolveConnectionConfig, resolveFromEnv, validateConfig } from './config';
import type { AppConfigManifest } from './manifest';

describe('configSchema (the manifest app release publishes)', () => {
  it('declares the two connection fields with their env vars', () => {
    expect(Object.keys(configSchema.fields)).toEqual(['endpoint', 'accessToken']);
    expect(configSchema.fields.endpoint.env).toBe('B2BSELLERS_ENDPOINT');
    expect(configSchema.fields.accessToken.env).toBe('B2BSELLERS_ACCESS_TOKEN');
  });

  it('marks the access token as a secret field and the endpoint constraint as data', () => {
    expect(configSchema.fields.accessToken.secret).toBe(true);
    expect(configSchema.fields.endpoint.constraints).toEqual({ notEndsWith: '/store-api' });
  });
});

describe('resolveFromEnv', () => {
  it('reads each field from its declared environment variable', () => {
    const cfg = resolveFromEnv(configSchema, { B2BSELLERS_ENDPOINT: 'https://shop.example.com', B2BSELLERS_ACCESS_TOKEN: 'SWSC123' } as NodeJS.ProcessEnv);
    expect(cfg).toEqual({ endpoint: 'https://shop.example.com', accessToken: 'SWSC123' });
  });

  it('yields empty strings when unset (so validation, not a missing key, reports it)', () => {
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

  it('collects several problems into one message', () => {
    expect(() => validateConfig({ endpoint: '', accessToken: '' })).toThrow(/B2BSELLERS_ENDPOINT[\s\S]*B2BSELLERS_ACCESS_TOKEN/);
  });

  it('is generic over the manifest — a made-up manifest validates by its own rules', () => {
    const m = { fields: { token: { type: 'text', label: 'Token', description: '', required: true, env: 'X_TOKEN' } } } as unknown as AppConfigManifest;
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
