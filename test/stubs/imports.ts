/**
 * Stand-in for Nuxt's `#imports` alias under vitest.
 *
 * Runtime files import their framework helpers from `#imports`, which only
 * exists inside a Nuxt build. A unit test needs the module to resolve, not to
 * behave: `defineNitroPlugin` is the identity in the framework too, and a test
 * that wants different behaviour mocks the module itself.
 */
export const defineNitroPlugin = <T>(plugin: T): T => plugin;
