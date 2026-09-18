/**
 * The **generic config handler** — resolves and validates an app's config purely
 * from its manifest, with no knowledge of any particular field, group or nesting.
 * Written to be lifted into `@laioutr-core/kit` as a shared `defineAppConfig` so
 * every app shares one implementation; here it is bound to this app's manifest.
 *
 * The manifest is **pure data**: `manifest.json` at the package root, imported via
 * the `#manifest` subpath (`package.json` `imports`) so no file location leaks into
 * the code. It is a **cascading tree** — scope → block → section → `fields` (e.g.
 * `studioConfig.b2b.connection.fields`) — and the handler collects `fields` from
 * anywhere in it, so the tree can grow (new blocks, sections, config domains)
 * without any code change. It is the only file to edit to add or change config.
 *
 * `configSchema` is re-exported from `src/module.ts`, where `laioutr app release`
 * reads it and stores it as `app_versions.definition`. Identity (name/version/
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
  /** Environment variable that fills this field on the server when config is empty. */
  env: string;
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

/** Every field across the whole manifest tree, flattened — nesting is irrelevant to the handler. */
function collectFields(node: unknown, out: Record<string, ConfigFieldDef> = {}): Record<string, ConfigFieldDef> {
  if (!node || typeof node !== 'object') return out;
  const obj = node as Record<string, unknown>;
  if (obj.fields && typeof obj.fields === 'object') Object.assign(out, obj.fields as Record<string, ConfigFieldDef>);
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'fields' || META_KEYS.has(key)) continue;
    if (value && typeof value === 'object') collectFields(value, out);
  }
  return out;
}

/** The resolved config: one string per declared field. */
export type AppConfig = { endpoint: string; accessToken: string };
export type ConfigKey = keyof AppConfig;

const APP_NAME = '@laioutr/app-b2bsellers';

/**
 * Minimal structural check of the manifest itself — that every field declares a
 * valid `type`, a `label`, a unique `env`, and a compilable `pattern`. Meant to
 * run on push (see `config.test.ts`) so a malformed manifest fails before release,
 * not at a customer's first request.
 */
export function validateManifest(m: AppConfigManifest = manifest): void {
  const fields = collectFields(m);
  const errors: string[] = [];
  if (Object.keys(fields).length === 0) errors.push('the manifest declares no fields');
  const seenEnv = new Map<string, string>();
  for (const [key, raw] of Object.entries(fields)) {
    const def = raw as Partial<ConfigFieldDef>;
    const at = `field "${key}"`;
    if (!def.type || !FIELD_TYPES.has(def.type)) errors.push(`${at}: type must be one of text|url|secret (got ${JSON.stringify(def.type)})`);
    if (!def.label) errors.push(`${at}: label is required`);
    if (typeof def.required !== 'boolean') errors.push(`${at}: required must be a boolean`);
    if (def.secret !== undefined && typeof def.secret !== 'boolean') errors.push(`${at}: secret must be a boolean`);
    if (!def.env) errors.push(`${at}: env is required`);
    else if (seenEnv.has(def.env)) errors.push(`${at}: env "${def.env}" is already used by "${seenEnv.get(def.env)}"`);
    else seenEnv.set(def.env, key);
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

/** Field values read from the environment — the module's defaults and the request-time fallback. */
export function resolveFromEnv(m: AppConfigManifest = manifest, env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, def] of Object.entries(collectFields(m))) out[key] = env[def.env] ?? '';
  return out;
}

/** Apply one field's declarative rules; push readable messages onto `errors`. */
function checkField(value: string, def: ConfigFieldDef, errors: string[]): void {
  if (!value) {
    if (def.required) errors.push(`${def.label} is missing — set it in the app config or the ${def.env} environment variable`);
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
    checkField(value, def, errors);
  }
  if (errors.length) throw new Error(`${appName} is misconfigured:\n- ${errors.join('\n- ')}`);
  return out;
}

// ── this app's typed bindings (the only place the concrete field keys appear) ──

/** The module defaults: every field from its environment variable. */
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
