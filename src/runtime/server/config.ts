/**
 * The app's configuration manifest — the single source of truth for its two
 * connection settings.
 *
 * `configSchema` is re-exported from `src/module.ts`; the Laioutr CLI's
 * `app release` imports it (via jiti) and stores it as the version's
 * `definition` (see `app_versions.definition`), so the Cockpit can render a
 * settings form from it. The same field list drives the module's `defaults`
 * (from the environment) and the boot-time validation below, so a field is
 * declared in exactly one place.
 *
 * **The exact field-definition shape the Cockpit renders is not yet fixed**
 * (LAIOUTR-94 / PR #610 — "what do these definitions look like"). This app is the
 * first to publish one, so treat the shape as provisional and align it with the
 * platform's field renderers before relying on it. Lives under `runtime/` so the
 * request-time client can import the validation without pulling in build-time code.
 */

export interface ConfigFieldDef {
  /** Maps onto a Cockpit field renderer. `secret` is a write-only, encrypted input. */
  type: 'text' | 'url' | 'secret';
  label: string;
  description: string;
  required: boolean;
  /** Environment variable that fills this field on the server when config is empty. */
  env: string;
  /** Write-only, stored encrypted, never echoed back. */
  secret?: boolean;
}

export const configSchema = {
  fields: {
    endpoint: {
      type: 'url',
      label: 'Shop endpoint',
      description:
        'Origin of the B2B-Sellers Shopware shop, e.g. https://shop.example.com — WITHOUT a /store-api suffix (the client appends /store-api and /b2b itself).',
      required: true,
      env: 'B2BSELLERS_ENDPOINT',
    },
    accessToken: {
      type: 'secret',
      label: 'Store API access key (sw-access-key)',
      description: "The sales-channel access key of the shop. Write-only; stored encrypted; never exposed to the browser.",
      required: true,
      secret: true,
      env: 'B2BSELLERS_ACCESS_TOKEN',
    },
  },
} as const satisfies { fields: Record<string, ConfigFieldDef> };

export type B2bSellersConfig = Record<keyof typeof configSchema.fields, string>;

/**
 * Field values read from the environment — the module's defaults, and the
 * request-time fallback. Empty string when a variable is unset, so validation
 * (not a missing key) is what reports it.
 */
export function resolveConfigFromEnv(env: NodeJS.ProcessEnv = process.env): B2bSellersConfig {
  const out = {} as B2bSellersConfig;
  for (const key of Object.keys(configSchema.fields) as (keyof B2bSellersConfig)[]) {
    out[key] = env[configSchema.fields[key].env] ?? '';
  }
  return out;
}

/**
 * Validate a resolved config, returning the trimmed values or throwing an error
 * that names exactly what is wrong — so a misconfiguration fails fast with a
 * readable message instead of surfacing as an opaque 401 on the first shop call.
 */
export function validateB2bSellersConfig(config: Partial<B2bSellersConfig>): B2bSellersConfig {
  const errors: string[] = [];
  const out = {} as B2bSellersConfig;

  for (const key of Object.keys(configSchema.fields) as (keyof B2bSellersConfig)[]) {
    const def = configSchema.fields[key];
    const value = (config[key] ?? '').trim();
    out[key] = value;

    if (!value) {
      if (def.required) errors.push(`${def.label} is missing — set it in the app config or the ${def.env} environment variable`);
      continue;
    }
    if (def.type === 'url') {
      let url: URL | undefined;
      try {
        url = new URL(value);
      } catch {
        errors.push(`${def.label} must be a URL (got "${value}")`);
      }
      if (url && /\/store-api\/?$/.test(url.pathname)) {
        errors.push(`${def.label} must be the shop origin WITHOUT a /store-api suffix (got "${value}")`);
      }
    }
  }

  if (errors.length) {
    throw new Error(`@laioutr/app-b2bsellers is misconfigured:\n- ${errors.join('\n- ')}`);
  }
  return out;
}
