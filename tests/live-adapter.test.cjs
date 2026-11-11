const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual TypeScript service modules without loading native Expo code in Node.
function load(relative, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, setTimeout, clearTimeout, AbortController, URLSearchParams, fetch: globalThis.fetch, console, process }, { filename: relative });
  return exports;
}
const errors = load('src/services/hotApi.ts', {});
const contracts = load('src/services/contracts.ts', {});
function setup() {
  const storage = new Map();
  const calls = [];
  let scenario = 'success';
  const wire = state => ({ id: 'tx1', reference: 'ref1', type: 'airtime', title: 'DEMO airtime', recipient: '0771234567', amount: '1.00', fee: '0.00', currency: 'USD', date: new Date().toISOString(), status: state, verificationState: state === 'pending' ? 'unknown' : 'confirmed', demonstration: true });
  const request = async (route, options = {}) => {
    calls.push({ route, options });
    if (route === '/auth/login' || route === '/auth/refresh') return { user: { accountId: 'demo-1', firstName: 'Demo', lastName: 'User', mobile: '0771234567', email: '' }, accessToken: 'app-access', refreshToken: 'app-refresh', expiresAt: new Date(Date.now() + 600000).toISOString(), demonstration: true };
    if (route === '/account') return { user: { accountId: 'demo-1', firstName: 'Demo', lastName: 'User', mobile: '0771234567', email: '' }, demonstration: true };
    if (route === '/products') return [{ id: 'demo-airtime', category: 'airtime', network: 'econet', currency: 'USD' }];
    if (route === '/quotes') return { id: 'quote1', category: 'airtime', expiresAt: new Date(Date.now() + 60000).toISOString() };
    if (route === '/recharge/airtime') {
      if (scenario === 'timeout') throw new errors.ApiError('Response lost', 'CONNECTION_UNKNOWN');
      return wire('success');
    }
    if (route.startsWith('/purchase-intents/')) return { transactionId: 'tx1', transaction: wire(scenario === 'timeout' ? 'pending' : 'success') };
    if (route.endsWith('/verify')) { scenario = 'success'; return wire('success'); }
    if (route === '/account/balances') return [{ id: '4', balance: '40.00', currency: 'USD' }];
    if (route.startsWith('/transactions?') || route.startsWith('/vault/tokens?')) return { items: [wire('success')], nextCursor: route.includes('cursor=') ? null : 'next-page' };
    if (route === '/auth/logout') return undefined;
    throw new Error(`Unmapped route: ${route}`);
  };
  const { liveHotApi } = load('src/services/liveHotApi.ts', {
    'expo-crypto': { randomUUID: () => 'random-key-1234567890' },
    './deviceStorage': { deviceStorage: { get: async key => storage.get(key) ?? null, set: async (key, value) => { storage.set(key, value); }, remove: async key => { storage.delete(key); } } },
    './contracts': contracts, './hotApi': errors, './httpClient': { request },
  });
  return { api: liveHotApi, calls, storage, scenario: value => { scenario = value; } };
}
test('backend adapter captures app session, maps balances, and submits an idempotent quote reference', async () => {
  const s = setup();
  const user = await s.api.login({ mobile: '0771234567', password: 'demo-password' });
  assert.equal(user.demonstration, true);
  assert.equal((await s.api.getStockAccounts())[0].balance, 40);
  const order = { kind: 'airtime', network: 'econet', number: '0771234567', amount: 1 };
  const quote = await s.api.quote(order);
  const result = await s.api.purchase(order, quote);
  assert.equal(result.status, 'success');
  const call = s.calls.find(c => c.route === '/recharge/airtime');
  assert.equal(call.options.body.quoteId, 'quote1');
  assert.equal(call.options.key, 'random-key-1234567890');
  assert.equal(call.options.token, 'app-access');
  assert.equal(call.options.body.amount, undefined);
  assert.equal(s.storage.has('hot-purchase-demo-1'), false);
});
test('lost purchase response retains recovery key and next tap looks up without dispatching again', async () => {
  const s = setup(); await s.api.login({ mobile: '0771234567', password: 'demo-password' });
  const order = { kind: 'airtime', network: 'econet', number: '0771234567', amount: 1 };
  const quote = await s.api.quote(order); s.scenario('timeout');
  await assert.rejects(s.api.purchase(order, quote));
  assert.equal(s.storage.has('hot-purchase-demo-1'), true);
  const recovered = await s.api.purchase(order, quote);
  assert.equal(recovered.status, 'pending');
  assert.equal(s.calls.filter(c => c.route === '/recharge/airtime').length, 1);
  await assert.rejects(s.api.quote(order));
  const confirmed = await s.api.verifyTransaction('tx1');
  assert.equal(confirmed.status, 'success');
  assert.equal(s.storage.has('hot-purchase-demo-1'), false);
});
test('logout clears refresh credentials and prevents requests under old user', async () => {
  const s = setup(); await s.api.login({ mobile: '0771234567', password: 'demo-password' });
  await s.api.logout();
  assert.equal(s.storage.has('hot-refresh'), false);
  await assert.rejects(s.api.getStockAccounts());
});
test('DTO adapter rejects unconfirmed success and invalid money instead of showing a false receipt', () => {
  assert.throws(() => contracts.transactionFromWire({ id: '1', status: 'success', verificationState: 'unknown', amount: '1', fee: '0' }));
  assert.throws(() => contracts.displayMoney('NaN'));
});
test('history and vault page adapters retain cursor and normalize display amounts', async () => {
  const s = setup(); await s.api.login({ mobile: '0771234567', password: 'demo-password' });
  const first = await s.api.getTransactionsPage();
  assert.equal(first.nextCursor, 'next-page');assert.equal(first.items[0].amount, 1);
  assert.equal((await s.api.getTransactionsPage(first.nextCursor)).nextCursor, null);
  assert.equal((await s.api.getVaultPage()).nextCursor, 'next-page');
});
