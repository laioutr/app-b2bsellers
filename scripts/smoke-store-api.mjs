#!/usr/bin/env node
/**
 * Exercises the operations map against a real shop.
 *
 * `verify-openapi.mjs` compares the map with a document. This calls the shop,
 * which is a stronger claim: a route can match the document and still 404, and
 * the document can omit a route that works. Read-only — every mutating
 * operation is skipped by name, not by guesswork.
 *
 * Without credentials it still tells you whether each path exists: 404 means
 * the map is wrong, 401/403 means the route is there and wants a session.
 * With credentials it reads real data, and by-id routes are exercised with an
 * id harvested from the matching list route.
 *
 * Usage:
 *   node scripts/smoke-store-api.mjs
 *   node scripts/smoke-store-api.mjs --user=buyer@example.com --password=...
 *
 * Shop and key come from `laioutrrc.json`, or SHOPWARE_SHOP_URL /
 * SHOPWARE_ACCESS_KEY. Credentials may also come from B2B_USER / B2B_PASSWORD.
 *
 * Exit: 0 when no path is missing, 1 when one is, 2 when it could not run.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OPERATIONS_FILE = resolve(ROOT, 'src/runtime/server/client/operations.ts');
const RC_FILE = resolve(ROOT, 'laioutrrc.json');
const APP_NAME = '@laioutr/app-b2bsellers';

const argv = process.argv.slice(2);
const opt = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const asJson = argv.includes('--json');

const note = (msg) => {
  if (!asJson) process.stderr.write(`${msg}\n`);
};
const fail = (msg) => {
  process.stderr.write(`${msg}\n`);
  process.exit(2);
};

/**
 * Anything that writes, sends mail, or moves an approval along. Matched on the
 * operation name so a new mutating route has to be added here deliberately
 * rather than being swept in by a pattern.
 */
const MUTATING = new Set([
  'login',
  'logout',
  'createCustomerActivity',
  'updateCustomerActivity',
  'deleteCustomerActivity',
  'createEmployee',
  'addEmployee',
  'updateEmployee',
  'deleteEmployee',
  'createCostCenter',
  'updateCostCenter',
  'patchCostCenter',
  'deleteCostCenter',
  'createCustomerProductNumber',
  'deleteCustomerProductNumber',
  'importCustomerProductNumbers',
  'createBudget',
  'updateBudget',
  'patchBudget',
  'deleteBudget',
  'createProductList',
  'updateProductList',
  'deleteProductList',
  'removeProductListProduct',
  'updateOffer',
  'convertOfferToOrder',
  'sendOfferMail',
  'generateOfferDocument',
  'createOrderApproval',
  'approveOrderApproval',
  'declineOrderApproval',
  'executeOrderApproval',
  'refreshOrderApproval',
  'updateOrderApproval',
  'remindOrderApproval',
  'remindAllOrderApproval',
  'updatePendingOrderApproval',
  'updateOrderApprovalLineItem',
  'deleteOrderApprovalLineItem',
  'setOrderApprovalCustomerSettings',
  'sendProductRequest',
  'salesRepFastOrder',
  'accountRequest',
]);

/** Which list operation supplies the id for a by-id operation. */
const ID_SOURCE = {
  getOffer: 'listOffers',
  getEmployee: 'listEmployees',
  getEmployeeOrder: 'listEmployeeOrders',
  getCostCenter: 'listCostCenters',
  getBudget: 'listBudgets',
  budgetOrders: 'listBudgets',
  budgetOrdersFiltered: 'listBudgets',
  getProductList: 'listProductLists',
  getOrderApproval: 'listOrderApprovals',
  orderApprovalActivity: 'listOrderApprovals',
  orderApprovalApprovers: 'listOrderApprovals',
  getCustomerActivity: 'listCustomerActivity',
  getCustomerActivityType: 'listCustomerActivityType',
};

const OPERATION_LINE = /^\s*'([A-Za-z0-9_]+) (get|post|put|patch|delete) (\/[^']*)':/gm;

async function readOperations() {
  const source = await readFile(OPERATIONS_FILE, 'utf8').catch(() => fail(`Cannot read ${OPERATIONS_FILE}`));
  const operations = [...source.matchAll(OPERATION_LINE)].map(([, name, method, path]) => ({
    name,
    method,
    path,
    pathParams: [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]),
  }));
  if (operations.length === 0) fail(`No operations parsed from ${OPERATIONS_FILE}`);
  return operations;
}

async function readConnection() {
  let endpoint = process.env.SHOPWARE_SHOP_URL;
  let accessToken = process.env.SHOPWARE_ACCESS_KEY;
  if (!endpoint || !accessToken) {
    const rc = await readFile(RC_FILE, 'utf8')
      .then(JSON.parse)
      .catch(() => null);
    const config = rc?.apps?.find((app) => app.name === APP_NAME)?.config;
    endpoint ??= config?.endpoint;
    accessToken ??= config?.accessToken;
  }
  if (!endpoint || !accessToken) {
    fail(
      'No shop connection.\n' +
        `  Put the app config in ${RC_FILE}, or set SHOPWARE_SHOP_URL and SHOPWARE_ACCESS_KEY.`
    );
  }
  return { endpoint: endpoint.replace(/\/+$/, ''), accessToken };
}

/** Collects the first plausible entity id out of whatever shape a list returns. */
function firstId(payload) {
  const candidates = [payload?.elements, payload?.data, payload, payload?.orderApprovals].filter(Array.isArray);
  for (const list of candidates) {
    const id = list.find((entry) => typeof entry?.id === 'string')?.id;
    if (id) return id;
  }
  return null;
}

async function main() {
  const { endpoint, accessToken } = await readConnection();
  const operations = await readOperations();

  const headers = { 'sw-access-key': accessToken, 'content-type': 'application/json', accept: 'application/json' };
  let contextToken = null;

  const call = async (method, path, body) => {
    const response = await fetch(`${endpoint}${path}`, {
      method: method.toUpperCase(),
      headers: { ...headers, ...(contextToken ? { 'sw-context-token': contextToken } : {}) },
      body: method === 'get' ? undefined : JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(20_000),
    }).catch((error) => ({ ok: false, status: 0, statusText: error.message, json: async () => null }));

    const rotated = response.headers?.get?.('sw-context-token');
    if (rotated) contextToken = rotated;
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload };
  };

  const user = opt('user') ?? process.env.B2B_USER;
  const password = opt('password') ?? process.env.B2B_PASSWORD;
  if (user && password) {
    const { status, payload } = await call('post', '/store-api/account/login', { username: user, password });
    if (status !== 200) {
      fail(`Login failed: ${status}. Without a session almost everything answers 403; fix the credentials first.`);
    }
    contextToken = payload?.contextToken ?? contextToken;
    note(`Logged in as ${user}`);
  } else {
    note('No credentials — checking which paths exist. 403 means the route is there and wants a session.');
  }

  // List operations first, so by-id operations can borrow an id.
  const ordered = [...operations].sort((a, b) => Number(a.pathParams.length > 0) - Number(b.pathParams.length > 0));
  const ids = new Map();
  const results = [];

  for (const operation of ordered) {
    if (MUTATING.has(operation.name)) {
      results.push({ ...operation, status: null, verdict: 'SKIPPED', detail: 'mutates state' });
      continue;
    }

    let path = operation.path;
    if (operation.pathParams.length > 0) {
      const source = ID_SOURCE[operation.name];
      const id = source ? ids.get(source) : null;
      if (!id) {
        results.push({ ...operation, status: null, verdict: 'SKIPPED', detail: 'no id available' });
        continue;
      }
      for (const param of operation.pathParams) path = path.replace(`{${param}}`, id);
    }

    const { status, payload } = await call(operation.method, path);
    if (operation.pathParams.length === 0) {
      const id = firstId(payload);
      if (id) ids.set(operation.name, id);
    }

    const verdict = (() => {
      if (status === 404) return 'PATH_MISSING';
      if (status === 401 || status === 403) return 'NEEDS_SESSION';
      return status < 400 ? 'OK' : 'ERROR';
    })();
    results.push({ ...operation, status, verdict, count: Array.isArray(payload?.elements) ? payload.elements.length : null });
  }

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ endpoint, loggedIn: Boolean(contextToken), results }, null, 2)}\n`);
  } else {
    const width = Math.max(...results.map((r) => r.name.length));
    for (const result of results) {
      if (result.verdict === 'SKIPPED') continue;
      const count = result.count === null ? '' : `  ${result.count} item(s)`;
      process.stdout.write(
        `${result.verdict.padEnd(14)} ${result.name.padEnd(width)}  ${String(result.status).padStart(3)}  ` +
          `${result.method.toUpperCase()} ${result.path}${count}\n`
      );
    }
    const tally = (verdict) => results.filter((r) => r.verdict === verdict).length;
    process.stdout.write(
      `\n${results.length} operations — ${tally('OK')} ok · ${tally('NEEDS_SESSION')} needs session · ` +
        `${tally('PATH_MISSING')} path missing · ${tally('ERROR')} error · ${tally('SKIPPED')} skipped\n`
    );
  }

  process.exit(results.some((r) => r.verdict === 'PATH_MISSING') ? 1 : 0);
}

await main();
