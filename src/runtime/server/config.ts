/**
 * The **generic config handler** — resolves and validates an app's config purely
 * from its {@link AppConfigManifest}, with no knowledge of any particular field.
 * It is written to be lifted into `@laioutr-core/kit` as a shared `defineAppConfig`
 * so every app shares one implementation; here it is bound to this app's manifest.
 *
 * `configSchema` is re-exported from `src/module.ts`, where `laioutr app release`
 * reads it and stores it as the version's `app_versions.definition`.
 */
import { type AppConfig, type AppConfigManifest, type ConfigKey, manifest } from './manifest';

/** What the platform stores as `app_versions.definition` and renders a form from. */
export { manifest as configSchema } from './manifest';

const APP_NAME = '@laioutr/app-b2bsellers';

/** Field values read from the environment — the module's defaults and the request-time fallback. */
export function resolveFromEnv(m: AppConfigManifest = manifest, env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, def] of Object.entries(m.fields)) out[key] = env[def.env] ?? '';
  return out;
}

/** Apply one field's declarative rules; push readable messages onto `errors`. */
function checkField(value: string, def: AppConfigManifest['fields'][string], errors: string[]): void {
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
  for (const [key, def] of Object.entries(m.fields)) {
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
