/**
 * The **generic config handler** — resolves and validates an app's config purely
 * from its manifest, with no knowledge of any particular field, group or nesting.
 * Written to be lifted into `@laioutr-core/kit` as a shared `defineAppConfig` so
 * every app shares one implementation; here it is bound to this app's manifest.
 *
 * The manifest is **pure data**: `manifest.json` at the package root, imported via
 * the `#manifest` subpath (`package.json` `imports`). It is a **cascading tree** —
 * scope → block → section → `fields` (e.g. `studioConfig.b2b.connection.fields`) —
 * and the handler collects `fields` from anywhere in it, so the tree can grow
 * without any code change. It is the only file to edit to add or change config.
 *
 * **The manifest is the platform's config-field definition** (it becomes
 * `app_versions.definition`, which the Cockpit renders a Studio form from, and the
 * chosen values flow through `laioutrrc.json → apps[].config`). The manifest holds
 * no environment-variable names — the primary source is that project config. The
 * environment is only an **app-side fallback** for a host that has no Studio value
 * yet (e.g. Vercel today), and its variable name is derived by convention here, not
 * declared in the manifest: `B2BSELLERS_` + the field key in UPPER_SNAKE_CASE.
 *
 * `configSchema` is re-exported from `src/module.ts`. Identity (name/version/
 * peer-deps) is not here — the platform reads it from `package.json`.
 */
import manifestData from '#manifest';

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
  /** Write-only, stored encrypted, never echoed back. */
  secret?: boolean;
  constraints?: ConfigFieldConstraints;
}

/** The manifest is a free-form cascading tree; fields live under any `fields` node. */
export type AppConfigManifest = Record<string, unknown>;

/** What the platform stores as `app_versions.definition` and renders a form from. */
export { default as configSchema } from '#manifest';

const manifest = manifestData as AppConfigManifest;

const FIELD_TYPES = new Set(['text', 'url', 'secret']);
const META_KEYS = new Set(['label', 'description']);

/** Prefix for the environment fallback of every field. Would be per-app in a shared handler. */
const ENV_PREFIX = 'B2BSELLERS_';

/** The fallback environment variable of a field, by convention — not declared in the manifest. */
export function envVarFor(key: string): string {
  return ENV_PREFIX + key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

/** Every `[key, field]` across the whole manifest tree, in order (duplicates kept, for validation). */
function fieldEntries(node: unknown, acc: [string, ConfigFieldDef][] = []): [string, ConfigFieldDef][] {
  if (!node || typeof node !== 'object') return acc;
  const obj = node as Record<string, unknown>;
  if (obj.fields && typeof obj.fields === 'object') {
    for (const [key, def] of Object.entries(obj.fields as Record<string, ConfigFieldDef>)) acc.push([key, def]);
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'fields' || META_KEYS.has(key)) continue;
    if (value && typeof value === 'object') fieldEntries(value, acc);
  }
  return acc;
}

/** The flattened field map used by the handler; duplicate keys are a manifest error (see validateManifest). */
const collectFields = (m: AppConfigManifest): Record<string, ConfigFieldDef> => Object.fromEntries(fieldEntries(m));

/** The resolved config: one string per declared field. */
export type AppConfig = { endpoint: string; accessToken: string };
export type ConfigKey = keyof AppConfig;

const APP_NAME = '@laioutr/app-b2bsellers';

/**
 * Minimal structural check of the manifest itself — every field declares a valid
 * `type`, a `label`, and a compilable `pattern`, and no two fields share a key.
 * Meant to run on push (see `config.test.ts`) and in module setup, so a malformed
 * manifest fails at build/release, not at a customer's first request.
 */
export function validateManifest(m: AppConfigManifest = manifest): void {
  const entries = fieldEntries(m);
  const errors: string[] = [];
  if (entries.length === 0) errors.push('the manifest declares no fields');
  const seen = new Set<string>();
  for (const [key, raw] of entries) {
    const def = raw as Partial<ConfigFieldDef>;
    const at = `field "${key}"`;
    if (seen.has(key)) errors.push(`${at}: duplicate field key`);
    seen.add(key);
    if (!def.type || !FIELD_TYPES.has(def.type)) errors.push(`${at}: type must be one of text|url|secret (got ${JSON.stringify(def.type)})`);
    if (!def.label) errors.push(`${at}: label is required`);
    if (typeof def.required !== 'boolean') errors.push(`${at}: required must be a boolean`);
    if (def.secret !== undefined && typeof def.secret !== 'boolean') errors.push(`${at}: secret must be a boolean`);
    if (def.constraints?.pattern !== undefined) {
      try {
        RegExp(def.constraints.pattern);
      } catch {
        errors.push(`${at}: constraints.pattern is not a valid regex`);
      }
    }
  }
  if (errors.length) throw new Error(`${APP_NAME} manifest is invalid:\n- ${errors.join('\n- ')}`);
}

/** Field values read from the environment fallback (derived var names) — the module defaults and request-time fallback. */
export function resolveFromEnv(m: AppConfigManifest = manifest, env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(collectFields(m))) out[key] = env[envVarFor(key)] ?? '';
  return out;
}

/** Apply one field's declarative rules; push readable messages onto `errors`. */
function checkField(key: string, value: string, def: ConfigFieldDef, errors: string[]): void {
  if (!value) {
    if (def.required) errors.push(`${def.label} is missing — set it in the Studio config or the ${envVarFor(key)} environment variable`);
    return;
  }
  if (def.type === 'url' && !URL.canParse(value)) {
    errors.push(`${def.label} must be a URL (got "${value}")`);
  }
  const c = def.constraints;
  if (c?.notEndsWith && value.replace(/\/+$/, '').endsWith(c.notEndsWith)) {
    errors.push(`${def.label} must not end with "${c.notEndsWith}" (got "${value}")`);
  }
  if (c?.pattern && !new RegExp(c.pattern).test(value)) {
    errors.push(`${def.label} has an invalid format (got "${value}")`);
  }
}

/**
 * Validate a resolved config against the manifest, returning the trimmed values
 * or throwing an error that names exactly what is wrong — so a misconfiguration
 * fails fast with a readable message instead of an opaque 401 on the first call.
 */
export function validateConfig(config: Record<string, string | undefined>, m: AppConfigManifest = manifest, appName = APP_NAME): Record<string, string> {
  const errors: string[] = [];
  const out: Record<string, string> = {};
  for (const [key, def] of Object.entries(collectFields(m))) {
    const value = (config[key] ?? '').trim();
    out[key] = value;
    checkField(key, value, def, errors);
  }
  if (errors.length) throw new Error(`${appName} is misconfigured:\n- ${errors.join('\n- ')}`);
  return out;
}

// ── this app's typed bindings (the only place the concrete field keys appear) ──

/** The module defaults: every field from its fallback environment variable. */
export const resolveDefaults = (): AppConfig => resolveFromEnv() as AppConfig;

/**
 * The connection for a request: the injected project config wins field-by-field,
 * an empty field falls back to its environment variable, then validation throws.
 * Generic over the manifest's keys, so a new field flows through untouched.
 */
export function resolveConnectionConfig(injected?: Partial<AppConfig>): AppConfig {
  const merged = resolveFromEnv();
  for (const key of Object.keys(merged) as ConfigKey[]) {
    const value = injected?.[key];
    if (value) merged[key] = value;
  }
  return validateConfig(merged) as AppConfig;
}
