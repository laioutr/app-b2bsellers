// The runtime-config namespace this module owns. Must equal the module
// `configKey` (the package `name`), so handlers read the same slice the module
// writes. Single source of truth for the runtime side.
export const APP_CONFIG_KEY = '@laioutr/app-b2bsellers';

// Shopware Store-API listing defaults / ceiling.
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 500;
