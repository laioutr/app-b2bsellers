#!/usr/bin/env node
/**
 * Verifies the operations map in `src/runtime/server/client/operations.ts`
 * against a shop's own OpenAPI document.
 *
 * The map was written without a live instance, so its paths, methods and status
 * codes are best-effort. This reports, per operation, whether the shop agrees.
 *
 * Usage:
 *   node scripts/verify-openapi.mjs --shop=https://shop.example.com --key=SWSC...
 *   node scripts/verify-openapi.mjs --spec=openapi3.json
 *   node scripts/verify-openapi.mjs --shop=... --key=... --save=openapi3.json
 *
 * Env fallbacks: SHOPWARE_SHOP_URL, SHOPWARE_ACCESS_KEY.
 *
 * Flags:
 *   --json     machine-readable report on stdout, nothing else
 *   --fields   for matching operations, print the response's top-level fields
 *   --all      also list spec paths the map does not cover (default: count only)
 *
 * Verdicts: OK, MISMATCH (status/body/parameter names), WRONG_METHOD,
 * PREFIX_MISSING (the path exists but the map omits the server prefix, so the
 * call 404s), PATH_MISSING.
 *
 * Exit: 0 clean, 1 mismatches found, 2 could not run.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OPERATIONS_FILE = resolve(ROOT, 'src/runtime/server/client/operations.ts');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const asJson = flag('json');
const showFields = flag('fields');
const showUncovered = flag('all');

/** Human messaging goes to stderr so `--json` stdout stays parseable. */
const note = (msg) => {
  if (!asJson) process.stderr.write(`${msg}\n`);
};
const fail = (msg) => {
  process.stderr.write(`${msg}\n`);
  process.exit(2);
};

// ── the operations map ────────────────────────────────────────────────────

/** `'listOffers post /store-api/offer/list': { body?: X } & Ok<Y>;` */
const OPERATION_LINE = /^\s*'([A-Za-z0-9_]+) (get|post|put|patch|delete) (\/[^']*)':\s*/gm;

/**
 * An entry's type can wrap over several lines, and its nested object literals
 * use `;` as a member separator — so the entry ends at the first `;` seen at
 * brace depth zero, not at the first newline. Reading only the first line made
 * multi-line entries look like they declared no request body at all.
 */
function entryBody(source, from) {
  let depth = 0;
  for (let i = from; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{' || ch === '<' || ch === '(') depth += 1;
    else if (ch === '}' || ch === '>' || ch === ')') depth -= 1;
    else if (ch === ';' && depth <= 0) return source.slice(from, i);
  }
  return source.slice(from);
}

async function readOperations() {
  const source = await readFile(OPERATIONS_FILE, 'utf8').catch(() => {
    fail(
      `Cannot read ${OPERATIONS_FILE}\n` +
        `The operations map only exists on the wrapper branch — check out feat/b2bsellers-api-wrapper first.`
    );
  });

  const operations = [];
  for (const match of source.matchAll(OPERATION_LINE)) {
    const [, name, method, path] = match;
    const tail = entryBody(source, match.index + match[0].length);
    operations.push({
      name,
      method,
      path,
      expectedStatus: tail.includes('NoContent') ? 204 : 200,
      declaresBody: /\bbody\??:/.test(tail),
      bodyRequired: /\bbody:/.test(tail),
      declaresQuery: /\bquery\??:/.test(tail),
      pathParams: [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]),
    });
  }
  if (operations.length === 0) fail(`No operations parsed from ${OPERATIONS_FILE} — has its shape changed?`);
  return operations;
}

// ── the specification ─────────────────────────────────────────────────────

async function loadSpec() {
  const specFile = opt('spec');
  if (specFile) {
    const raw = await readFile(resolve(specFile), 'utf8').catch(() => fail(`Cannot read spec file: ${specFile}`));
    return JSON.parse(raw);
  }

  const shop = (opt('shop') ?? process.env.SHOPWARE_SHOP_URL ?? '').replace(/\/+$/, '');
  const key = opt('key') ?? process.env.SHOPWARE_ACCESS_KEY ?? '';
  if (!shop || !key) {
    fail(
      'Need a shop and an access key.\n' +
        '  --shop=https://shop.example.com --key=SWSC...\n' +
        '  or SHOPWARE_SHOP_URL / SHOPWARE_ACCESS_KEY in the environment\n' +
        '  or --spec=<file> to verify against a document you already have.\n' +
        "The key is the sales channel's sw-access-key (Admin → Sales Channels → API access)."
    );
  }

  const url = `${shop}/store-api/_info/openapi3.json`;
  note(`Fetching ${url}`);

  const response = await fetch(url, {
    headers: { 'sw-access-key': key, accept: 'application/json' },
    signal: AbortSignal.timeout(Number(opt('timeout') ?? 30_000)),
  }).catch((error) => fail(`Request failed: ${error.message}`));

  if (!response.ok) {
    const HINTS = {
      401: ' — the sw-access-key was rejected. Check it belongs to this shop and the sales channel is active.',
      403: ' — the sw-access-key was rejected. Check it belongs to this shop and the sales channel is active.',
      404: ' — this Shopware version may not serve the store-api spec. Try the admin API or export it by hand.',
    };
    fail(`GET ${url} → ${response.status} ${response.statusText}${HINTS[response.status] ?? ''}`);
  }

  const spec = await response.json().catch(() => fail('Response was not JSON — check the shop URL points at the shop origin.'));
  const saveTo = opt('save');
  if (saveTo) {
    await writeFile(resolve(saveTo), JSON.stringify(spec, null, 2));
    note(`Saved specification to ${saveTo}`);
  }
  return spec;
}

/**
 * Shopware serves the store-api document with `/store-api` in `servers[].url`
 * and paths relative to it, so a declared `/store-api/offer/list` has to be
 * compared against the spec's `/offer/list`.
 *
 * Indexing both layouts at once — which this used to do — hides a real defect:
 * a map entry of `/b2b/cost-center` then "matches" the spec's `/b2b/cost-center`
 * and reads as OK, while the actual endpoint is `/store-api/b2b/cost-center`
 * and the call 404s. So the server prefix is authoritative when the document
 * declares one, and the bare layout is kept only to tell the operator that the
 * path exists but the prefix is missing.
 */
function indexSpecPaths(spec) {
  const serverPrefixes = [];
  for (const server of spec.servers ?? []) {
    const path = (() => {
      try {
        return new URL(server.url, 'https://placeholder.invalid').pathname;
      } catch {
        return server.url?.startsWith('/') ? server.url : '';
      }
    })();
    const trimmed = path?.replace(/\/+$/, '');
    if (trimmed && trimmed !== '') serverPrefixes.push(trimmed);
  }

  // No declared server: the paths are already absolute, so bare is authoritative.
  const prefixes = serverPrefixes.length > 0 ? serverPrefixes : [''];

  const authoritative = new Map();
  const bare = new Map();
  for (const [specPath, item] of Object.entries(spec.paths ?? {})) {
    // A handful of routes are annotated with their full path, so the key
    // already carries the server prefix. Prefixing again would point at
    // `/store-api/store-api/...`, which is a 404 — take the key as absolute.
    const alreadyAbsolute = prefixes.some((prefix) => prefix && specPath.startsWith(`${prefix}/`));
    if (alreadyAbsolute) {
      authoritative.set(normalize(specPath), { specPath, full: specPath, item });
      continue;
    }
    for (const prefix of prefixes) {
      authoritative.set(normalize(`${prefix}${specPath}`), { specPath, full: `${prefix}${specPath}`, item });
    }
    if (serverPrefixes.length > 0) bare.set(normalize(specPath), { specPath, full: specPath, item });
  }
  return { authoritative, bare, serverPrefix: prefixes[0] };
}

/** Path params are matched by position, not name — the shop is free to call it `{offerId}`. */
const normalize = (path) => path.replace(/\{[^}]+\}/g, '{}').replace(/\/+$/, '') || '/';

// ── response fields, for eyeballing DTO drift ─────────────────────────────

function resolveRef(spec, node, seen = new Set()) {
  let current = node;
  while (current?.$ref) {
    if (seen.has(current.$ref)) return undefined;
    seen.add(current.$ref);
    const segments = current.$ref.replace(/^#\//, '').split('/');
    current = segments.reduce((acc, segment) => acc?.[decodeURIComponent(segment.replace(/~1/g, '/').replace(/~0/g, '~'))], spec);
  }
  return current;
}

function responseFields(spec, operation, status) {
  const response = resolveRef(spec, operation.responses?.[String(status)] ?? operation.responses?.default);
  const schema = resolveRef(spec, Object.values(response?.content ?? {})[0]?.schema);
  const unwrapped = resolveRef(spec, schema?.type === 'array' ? schema.items : schema);
  const merged = unwrapped?.allOf
    ? unwrapped.allOf.reduce((acc, part) => ({ ...acc, ...(resolveRef(spec, part)?.properties ?? {}) }), {})
    : unwrapped?.properties;
  return Object.keys(merged ?? {});
}

// ── verification ──────────────────────────────────────────────────────────

function verify(operations, spec) {
  const { authoritative, bare, serverPrefix } = indexSpecPaths(spec);

  return operations.map((operation) => {
    const match = authoritative.get(normalize(operation.path));
    if (!match) {
      const withoutPrefix = bare.get(normalize(operation.path));
      if (withoutPrefix) {
        return {
          ...operation,
          verdict: 'PREFIX_MISSING',
          detail: `path exists, but only under the server prefix — it should be ${serverPrefix}${withoutPrefix.specPath}`,
          specPath: `${serverPrefix}${withoutPrefix.specPath}`,
          specKey: withoutPrefix.specPath,
        };
      }
      return { ...operation, verdict: 'PATH_MISSING', detail: 'no such path in the specification' };
    }

    const specOperation = match.item[operation.method];
    if (!specOperation) {
      const allowed = Object.keys(match.item)
        .filter((k) => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(k))
        .join(', ');
      return {
        ...operation,
        verdict: 'WRONG_METHOD',
        detail: `path exists but answers ${allowed || 'nothing'}`,
        specPath: match.full,
        specKey: match.specPath,
      };
    }

    const problems = [];
    const statuses = Object.keys(specOperation.responses ?? {});
    if (statuses.length > 0 && !statuses.includes(String(operation.expectedStatus))) {
      problems.push(`declares ${operation.expectedStatus}, specification documents ${statuses.join(', ')}`);
    }

    const specRequiresBody = specOperation.requestBody?.required === true;
    if (specRequiresBody && !operation.bodyRequired) {
      problems.push('specification requires a request body, the map makes it optional or absent');
    }
    if (operation.declaresBody && !specOperation.requestBody && operation.method !== 'get') {
      problems.push('map sends a body, specification documents none');
    }

    const specParams = (specOperation.parameters ?? [])
      .map((p) => resolveRef(spec, p))
      .filter((p) => p?.in === 'path')
      .map((p) => p.name);
    if (specParams.length !== operation.pathParams.length) {
      problems.push(`path parameters: map has ${operation.pathParams.length}, specification has ${specParams.length}`);
    } else if (specParams.length > 0 && specParams.join(',') !== operation.pathParams.join(',')) {
      problems.push(`path parameter named {${specParams.join('}, {')}} in the specification`);
    }

    return {
      ...operation,
      verdict: problems.length > 0 ? 'MISMATCH' : 'OK',
      detail: problems.join('; '),
      specPath: match.full,
      specKey: match.specPath,
      fields: showFields ? responseFields(spec, specOperation, operation.expectedStatus) : undefined,
    };
  });
}

// ── report ────────────────────────────────────────────────────────────────

const ORDER = { PATH_MISSING: 0, PREFIX_MISSING: 1, WRONG_METHOD: 2, MISMATCH: 3, OK: 4 };

function report(results, spec) {
  const byVerdict = (verdict) => results.filter((r) => r.verdict === verdict);
  const covered = new Set(results.map((r) => r.specKey).filter(Boolean));
  const uncovered = Object.keys(spec.paths ?? {})
    .filter((path) => !covered.has(path))
    .sort();

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          shop: spec.info?.title ?? null,
          specVersion: spec.info?.version ?? null,
          operations: results,
          summary: Object.fromEntries(Object.keys(ORDER).map((v) => [v, byVerdict(v).length])),
          uncoveredSpecPaths: uncovered,
        },
        null,
        2
      )}\n`
    );
    return;
  }

  const width = Math.max(...results.map((r) => r.name.length));
  for (const result of [...results].sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || a.name.localeCompare(b.name))) {
    if (result.verdict === 'OK' && !showFields) continue;
    process.stdout.write(`${result.verdict.padEnd(13)} ${result.name.padEnd(width)}  ${result.method.toUpperCase()} ${result.path}\n`);
    if (result.detail) process.stdout.write(`${''.padEnd(14)}${result.detail}\n`);
    if (result.fields?.length) process.stdout.write(`${''.padEnd(14)}response: ${result.fields.join(', ')}\n`);
  }

  const summary = Object.keys(ORDER)
    .map((verdict) => `${byVerdict(verdict).length} ${verdict.toLowerCase()}`)
    .join(' · ');
  process.stdout.write(`\n${results.length} operations checked — ${summary}\n`);

  if (uncovered.length > 0) {
    process.stdout.write(`${uncovered.length} specification paths are not in the map`);
    process.stdout.write(showUncovered ? `:\n${uncovered.map((p) => `  ${p}`).join('\n')}\n` : ` (--all to list them)\n`);
  }
}

// ── run ───────────────────────────────────────────────────────────────────

const operations = await readOperations();
const spec = await loadSpec();
note(`${operations.length} operations in the map, ${Object.keys(spec.paths ?? {}).length} paths in the specification\n`);

const results = verify(operations, spec);
report(results, spec);

process.exit(results.some((r) => r.verdict !== 'OK') ? 1 : 0);
