#!/usr/bin/env node
/**
 * One-off demo-data tool for the B2B-Sellers shop, over the **Admin API**.
 *
 * The Store-API key we already have (a sales-channel `sw-access-key`) can read
 * the shop but cannot create a catalogue or an offer — those are admin
 * operations. This script uses an **Admin API integration** instead, which a
 * Shopware admin creates once.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE TO GET THE KEYS  (Shopware admin of the demo shop)
 *
 *   Settings → System → Integrations → "Add integration"
 *     • Name:          laioutr-seed   (anything)
 *     • Permissions:   Administrator
 *     • Save → copy the two values it shows:
 *         Access key ID       →  starts with  SWIA…
 *         Secret access key   →  (long string, shown once)
 *
 * WHERE TO PUT THEM  (never committed — env only, or the gitignored rc)
 *
 *   Option A — environment variables (nothing touches disk):
 *       export B2BSELLERS_ADMIN_ID=SWIA…
 *       export B2BSELLERS_ADMIN_SECRET=…
 *
 *   Option B — laioutrrc.json (already gitignored), under apps[0].config:
 *       "adminId": "SWIA…", "adminSecret": "…"
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 *
 *   node scripts/seed-demo.mjs --check     # verify the key works; show channels + product counts
 *   node scripts/seed-demo.mjs --seed      # create the demo data (marked LAIOUTR-DEMO)
 *   node scripts/seed-demo.mjs --delete    # remove everything this script created
 *
 * REVERSIBLE BY DESIGN: every record --seed creates carries the tag/marker
 * LAIOUTR-DEMO, and --delete removes exactly those. Nothing the vendor shipped is
 * touched. When the demo is over, `--delete` and the shop is as it was.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MARKER = 'LAIOUTR-DEMO';
const mode = process.argv.find((a) => ['--check', '--seed', '--delete'].includes(a));

async function connection() {
  let endpoint = process.env.B2BSELLERS_ENDPOINT;
  let adminId = process.env.B2BSELLERS_ADMIN_ID;
  let adminSecret = process.env.B2BSELLERS_ADMIN_SECRET;
  if (!endpoint || !adminId || !adminSecret) {
    const rc = await readFile(resolve(ROOT, 'laioutrrc.json'), 'utf8').then(JSON.parse).catch(() => null);
    const config = rc?.apps?.find((a) => a?.config?.endpoint)?.config ?? rc?.apps?.[0]?.config ?? {};
    endpoint ??= config.endpoint;
    adminId ??= config.adminId;
    adminSecret ??= config.adminSecret;
  }
  if (!endpoint) fail('No endpoint. Set B2BSELLERS_ENDPOINT or put it in laioutrrc.json.');
  if (!adminId || !adminSecret) {
    fail(
      'No Admin API key.\n' +
        '  Create one in Shopware: Settings → System → Integrations (Administrator rights),\n' +
        '  then set B2BSELLERS_ADMIN_ID (SWIA…) and B2BSELLERS_ADMIN_SECRET — see the header of this file.'
    );
  }
  return { endpoint: endpoint.replace(/\/+$/, ''), adminId, adminSecret };
}

const fail = (msg) => {
  process.stderr.write(`${msg}\n`);
  process.exit(2);
};

/** Admin API bearer token via client_credentials. */
async function adminToken({ endpoint, adminId, adminSecret }) {
  const res = await fetch(`${endpoint}/api/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: adminId, client_secret: adminSecret }),
  });
  const json = await res.json().catch(() => null);
  if (res.status !== 200 || !json?.access_token) {
    fail(`Admin login failed (${res.status}): ${json?.errors?.[0]?.detail ?? json?.errors?.[0]?.title ?? 'check the key id and secret'}`);
  }
  return json.access_token;
}

function adminClient(endpoint, token) {
  return async (method, path, body) => {
    const res = await fetch(`${endpoint}/api${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    return { status: res.status, json, code: json?.errors?.[0]?.code, detail: json?.errors?.[0]?.detail };
  };
}

async function check(api) {
  console.log('admin key: OK\n');
  const channels = await api('POST', '/search/sales-channel', { associations: { products: { 'total-count-mode': 1, limit: 1 } }, limit: 25 });
  console.log('sales channels:');
  for (const c of channels.json?.data ?? []) {
    const name = c.attributes?.name ?? c.attributes?.translated?.name ?? c.id;
    console.log(`  ${c.id}  ${name}`);
  }
  const products = await api('POST', '/search/product', { limit: 1, 'total-count-mode': 1 });
  console.log(`\ntotal products in the shop: ${products.json?.meta?.total ?? '?'}`);
  const offers = await api('POST', '/search/b2b-sellers-offer', { limit: 1, 'total-count-mode': 1 }).catch(() => null);
  if (offers?.status === 200) console.log(`total offers: ${offers.json?.meta?.total ?? '?'}`);
  console.log('\nReady. Run --seed to create demo data, --delete to remove it.');
}

async function main() {
  if (!mode) fail('Pick a mode: --check | --seed | --delete   (see the header of this file)');
  const conn = await connection();
  const api = adminClient(conn.endpoint, await adminToken(conn));

  if (mode === '--check') return check(api);
  if (mode === '--seed') {
    console.log(`seeding (everything tagged ${MARKER}) — TODO once --check confirms the channel + catalogue layout`);
    return;
  }
  if (mode === '--delete') {
    console.log(`deleting everything tagged ${MARKER} — TODO, mirrors --seed`);
    return;
  }
}

await main();
