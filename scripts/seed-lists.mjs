#!/usr/bin/env node
/**
 * Seed product lists (Merklisten / Präsentationen) from the **user's own Store-API
 * session** — no admin key needed.
 *
 * The demo shop lets a signed-in B2B customer create and fill their own product
 * lists (`/store-api/product-lists/*`), so the Merklisten screen can be given real
 * data without touching the Shopware admin. Offers and the catalogue itself still
 * need an admin integration — the channel sells one product, so a list here can
 * only hold that one — but the lists are real, owned by the account, and show up
 * for it on open.
 *
 * Everything created is named with the LAIOUTR-DEMO prefix, and `--delete` removes
 * exactly those. Reversible.
 *
 * USAGE
 *   node scripts/seed-lists.mjs --check    # what lists / products this account has
 *   node scripts/seed-lists.mjs --seed     # create a few LAIOUTR-DEMO lists
 *   node scripts/seed-lists.mjs --delete   # remove the LAIOUTR-DEMO lists
 *
 *   --user=<email> --password=<pw>   default: m.sommer@luxon.de / b2bsellers
 *
 * Connection comes from laioutrrc.json (endpoint + sales-channel accessToken).
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = 'LAIOUTR-DEMO';
const argv = process.argv.slice(2);
const mode = argv.find((a) => ['--check', '--seed', '--delete'].includes(a));
const opt = (name, dflt) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? dflt;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => process.stdout.write(`\n`);
const fail = (m) => {
  process.stderr.write(`${m}\n`);
  process.exit(2);
};

const LISTS = [
  { name: `${PREFIX} Schaufenster Herbst`, type: 'wishlist' },
  { name: `${PREFIX} Weihnachts-Highlights`, type: 'wishlist' },
  { name: `${PREFIX} Frühjahr 2027 Vorschau`, type: 'presentation' },
];

async function main() {
  if (!mode) fail('Pick a mode: --check | --seed | --delete');
  const rc = await readFile(resolve(ROOT, 'laioutrrc.json'), 'utf8').then(JSON.parse).catch(() => fail('no laioutrrc.json'));
  const { endpoint, accessToken } = rc.apps?.[0]?.config ?? {};
  if (!endpoint || !accessToken) fail('laioutrrc.json has no endpoint/accessToken');
  const base = endpoint.replace(/\/+$/, '');

  const H = (t) => ({ 'sw-access-key': accessToken, 'content-type': 'application/json', accept: 'application/json', ...(t ? { 'sw-context-token': t } : {}) });
  let token = null;
  const call = async (method, path, body) => {
    const res = await fetch(`${base}${path}`, { method, headers: H(token), body: method === 'GET' ? undefined : JSON.stringify(body ?? {}) });
    const rot = res.headers.get('sw-context-token');
    if (rot) token = rot;
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    return { status: res.status, json, code: json?.errors?.[0]?.code, detail: json?.errors?.[0]?.detail };
  };

  // login, with backoff on the shop's rate limiter
  const user = opt('user', 'm.sommer@luxon.de');
  const password = opt('password', 'b2bsellers');
  for (let a = 1; ; a++) {
    const r = await call('POST', '/store-api/account/login', { username: user, password });
    if (r.status === 200) break;
    if (r.code === 'CHECKOUT__CUSTOMER_AUTH_THROTTLED' && a <= 5) {
      log(`  login throttled, waiting ${a * 60}s`);
      await sleep(a * 60_000);
      continue;
    }
    fail(`login failed: ${r.status} ${r.code ?? ''}`);
  }
  log(`signed in as ${user}\n`);

  const listId = (l) => (Array.isArray(l.id) ? l.id[0] : l.id);
  const myLists = async () => (await call('POST', '/store-api/product-lists', { limit: 100 })).json?.elements ?? [];
  const products = (await call('POST', '/store-api/product', { limit: 100 })).json?.elements ?? [];

  if (mode === '--check') {
    log(`sellable products on this channel: ${products.length} → ${products.map((p) => p.productNumber).join(', ')}`);
    const lists = await myLists();
    log(`\nthis account's lists: ${lists.length}`);
    for (const l of lists) log(`  ${l.name?.startsWith(PREFIX) ? '[demo]' : '     '} ${l.name}  · ${(l.items ?? []).length} items`);
    return;
  }

  if (mode === '--seed') {
    for (const spec of LISTS) {
      const created = await call('POST', '/store-api/product-lists/create', { name: spec.name, type: spec.type });
      if (created.status !== 200) {
        log(`FAIL create "${spec.name}": ${created.status} ${created.code ?? ''} ${created.detail ?? ''}`);
        continue;
      }
      const id = listId(created.json?.data ?? created.json);
      // fill with whatever the channel sells (one product today; loops cleanly when there are more)
      let added = 0;
      for (const [i, product] of products.slice(0, 5).entries()) {
        const r = await call('POST', `/store-api/product-lists/${id}/items`, { items: [{ productId: product.id, quantity: 1 + i }] });
        if (r.status === 200) added++;
      }
      log(`OK  ${spec.name}  · ${added} item(s)`);
    }
    const after = (await myLists()).filter((l) => l.name?.startsWith(PREFIX));
    log(`\n${after.length} LAIOUTR-DEMO lists now on the account.`);
    return;
  }

  if (mode === '--delete') {
    const demo = (await myLists()).filter((l) => l.name?.startsWith(PREFIX));
    for (const l of demo) {
      const r = await call('DELETE', `/store-api/product-lists/${listId(l)}`);
      log(`${r.status === 200 || r.status === 204 ? 'deleted' : `FAIL ${r.status}`}  ${l.name}`);
    }
    log(`\nremoved ${demo.length} LAIOUTR-DEMO lists.`);
  }
}

await main();
