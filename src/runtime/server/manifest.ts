/**
 * The app's **declarative config manifest** — the ONE place to add or change a
 * config field. Pure data: no logic lives here.
 *
 * What is deliberately NOT here: identity (name, version) and compatibility
 * (peer-dependencies). The platform reads those from `package.json`, so putting
 * them here would only duplicate a source of truth.
 *
 * The generic handler in `config.ts` turns this manifest into module defaults,
 * environment resolution and boot-time validation **with no per-field code** — so
 * adding a field, changing a label, or tightening a rule is an edit to this file
 * and nothing else. That handler carries no knowledge of these particular fields
 * and is written to be lifted into `@laioutr-core/kit` (a shared `defineAppConfig`)
 * so every app can share one implementation.
 *
 * `module.ts` re-exports this object as `configSchema`, which `laioutr app release`
 * stores as the version's `app_versions.definition`.
 */

/** Declarative validation rules, applied by the generic handler — never `if`s in code. */
export interface ConfigFieldConstraints {
  /** The value (ignoring a trailing slash) must not end with this. */
  notEndsWith?: string;
  /** The value must match this regular expression (source string). */
  pattern?: string;
}

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
  constraints?: ConfigFieldConstraints;
}

export interface AppConfigManifest {
  fields: Record<string, ConfigFieldDef>;
}

export const manifest = {
  fields: {
    endpoint: {
      type: 'url',
      label: 'Shop endpoint',
      description:
        'Origin of the B2B-Sellers Shopware shop, e.g. https://shop.example.com — WITHOUT a /store-api suffix (the client appends /store-api and /b2b itself).',
      required: true,
      env: 'B2BSELLERS_ENDPOINT',
      constraints: { notEndsWith: '/store-api' },
    },
    accessToken: {
      type: 'secret',
      label: 'Store API access key (sw-access-key)',
      description: 'The sales-channel access key of the shop. Write-only; stored encrypted; never exposed to the browser.',
      required: true,
      secret: true,
      env: 'B2BSELLERS_ACCESS_TOKEN',
    },
  },
} as const satisfies AppConfigManifest;

/** The field keys, from the manifest. Adding a field here widens this automatically. */
export type ConfigKey = keyof typeof manifest.fields;

/** The resolved config: one string per declared field. */
export type AppConfig = Record<ConfigKey, string>;
