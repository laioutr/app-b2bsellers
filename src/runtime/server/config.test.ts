import { describe, expect, it } from 'vitest';
import { configSchema, resolveConfigFromEnv, validateB2bSellersConfig } from './config';

describe('configSchema (the manifest app release publishes)', () => {
  it('declares the two connection fields with their env vars', () => {
    expect(Object.keys(configSchema.fields)).toEqual(['endpoint', 'accessToken']);
    expect(configSchema.fields.endpoint.env).toBe('B2BSELLERS_ENDPOINT');
    expect(configSchema.fields.accessToken.env).toBe('B2BSELLERS_ACCESS_TOKEN');
  });

  it('marks the access token as a secret field', () => {
    expect(configSchema.fields.accessToken.secret).toBe(true);
    expect(configSchema.fields.accessToken.type).toBe('secret');
  });
});

describe('resolveConfigFromEnv', () => {
  it('reads each field from its declared environment variable', () => {
    const cfg = resolveConfigFromEnv({ B2BSELLERS_ENDPOINT: 'https://shop.example.com', B2BSELLERS_ACCESS_TOKEN: 'SWSC123' } as NodeJS.ProcessEnv);
    expect(cfg).toEqual({ endpoint: 'https://shop.example.com', accessToken: 'SWSC123' });
  });

  it('yields empty strings when unset (so validation, not a missing key, reports it)', () => {
    expect(resolveConfigFromEnv({} as NodeJS.ProcessEnv)).toEqual({ endpoint: '', accessToken: '' });
  });
});

describe('validateB2bSellersConfig', () => {
  it('accepts a valid config and trims it', () => {
    expect(validateB2bSellersConfig({ endpoint: '  https://shop.example.com  ', accessToken: ' SWSC123 ' })).toEqual({
      endpoint: 'https://shop.example.com',
      accessToken: 'SWSC123',
    });
  });

  it('rejects a missing endpoint, naming the env var', () => {
    expect(() => validateB2bSellersConfig({ endpoint: '', accessToken: 'SWSC123' })).toThrow(/Shop endpoint is missing.*B2BSELLERS_ENDPOINT/s);
  });

  it('rejects a missing access token', () => {
    expect(() => validateB2bSellersConfig({ endpoint: 'https://shop.example.com', accessToken: '' })).toThrow(/access key[\s\S]*is missing[\s\S]*B2BSELLERS_ACCESS_TOKEN/);
  });

  it('rejects an endpoint carrying a /store-api suffix', () => {
    expect(() => validateB2bSellersConfig({ endpoint: 'https://shop.example.com/store-api', accessToken: 'SWSC123' })).toThrow(/WITHOUT a \/store-api suffix/);
    expect(() => validateB2bSellersConfig({ endpoint: 'https://shop.example.com/store-api/', accessToken: 'SWSC123' })).toThrow(/WITHOUT a \/store-api suffix/);
  });

  it('rejects an endpoint that is not a URL', () => {
    expect(() => validateB2bSellersConfig({ endpoint: 'not a url', accessToken: 'SWSC123' })).toThrow(/must be a URL/);
  });

  it('collects several problems into one message', () => {
    expect(() => validateB2bSellersConfig({ endpoint: '', accessToken: '' })).toThrow(/B2BSELLERS_ENDPOINT[\s\S]*B2BSELLERS_ACCESS_TOKEN/);
  });
});
