/* eslint-disable @typescript-eslint/no-empty-object-type */
import { addServerImportsDir, createResolver, defineNuxtModule, installModule } from '@nuxt/kit';
import { defu } from 'defu';
import { configSchema, resolveDefaults } from './runtime/server/config';
import { registerLaioutrApp } from '@laioutr-core/kit';
import { name, version } from '../package.json';

/**
 * The app's config manifest. Re-exported here because the Laioutr CLI's
 * `app release` imports `configSchema` from `src/module.ts` (via jiti) and stores
 * it as the version's `definition`. Single source of truth in `runtime/server/config`.
 */
export { configSchema };

/**
 * The options the module adds to the nuxt.config.ts.
 */
export interface ModuleOptions {
  /**
   * Base URL (shop origin) of the B2B Sellers Store API, e.g.
   * `https://shop.example.com`. Both the `/store-api/...` core endpoints and
   * the `/b2b/...` addon endpoints are resolved against this origin, so it
   * must NOT carry a `/store-api` suffix.
   *
   * @default '' (must be provided before the client can connect)
   */
  endpoint: string;
  /**
   * Shopware sales-channel access key (the `sw-access-key` header).
   *
   * This is a secret: it lives in the private runtime config only and is never
   * exposed to the client bundle. Delivered through the Laioutr project config
   * — the `@laioutr/app-b2bsellers` app entry's `config` in `laioutrrc.json`.
   *
   * @default '' (must be provided before the client can connect)
   */
  accessToken: string;
}

/**
 * The config the module adds to nuxt.runtimeConfig.public['@laioutr/app-b2bsellers'].
 *
 * Intentionally empty — this app holds no client-exposed config. The B2B
 * Sellers connection (incl. the access key) is server-only.
 */
export interface RuntimeConfigModulePublic {}

/**
 * The config the module adds to nuxt.runtimeConfig['@laioutr/app-b2bsellers']
 */
export interface RuntimeConfigModulePrivate extends ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: name, // configKey must match package name
  },
  // Default configuration options of the Nuxt module. The connection is normally
  // delivered through the Laioutr project config (`laioutrrc.json` → this app's
  // `config`); when that is absent — e.g. on a host where only environment
  // variables are available — these env fallbacks fill it. Precedence:
  // project config → environment → empty (then validation fails fast).
  defaults: resolveDefaults(),
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const resolveRuntimeModule = (path: string) => resolve('./runtime', path);

    nuxt.options.build.transpile.push(resolve('./runtime'));

    // Private runtime config: holds the B2B Sellers connection incl. the secret
    // access key. Server-only — never merged into the public config below.
    nuxt.options.runtimeConfig[name] = defu(nuxt.options.runtimeConfig[name] as Parameters<typeof defu>[0], _options);
    // Public runtime config: deliberately carries no module options so the
    // access key cannot leak into the client bundle.
    nuxt.options.runtimeConfig.public[name] = defu(nuxt.options.runtimeConfig.public[name] as Parameters<typeof defu>[0], {});

    // Expose the server-side B2B Sellers client (`useB2bSellersClient`) as a
    // Nitro auto-import for use in server routes and Orchestr handlers.
    addServerImportsDir(resolveRuntimeModule('server/client'));

    // Backend-only connector: registers Orchestr handlers, no frontend
    // sections/blocks, no image provider.
    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule('server/orchestr')],
    });

    // Install peer-dependency modules only on prepare-step so auto-imports
    // (#imports, #orchestr) and import-aliases resolve. No UI / image module —
    // this app ships no components.
    if (nuxt.options._prepare) {
      await installModule('@laioutr-core/frontend-core');
      await installModule('@laioutr-core/orchestr');
    }

    // Server
    // Server-only imports (client auto-import dir) registered above.
  },
});
