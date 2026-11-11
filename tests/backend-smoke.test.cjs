const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');

function load(file, dependencies) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, require: id => {
    if (!(id in dependencies)) throw Error(`Unexpected dependency ${id}`);
    return dependencies[id];
  }, AbortController, URLSearchParams, setTimeout, clearTimeout, fetch, console });
  return exports;
}

test('actual frontend HTTP adapter talks to the running Spring stub backend', { skip: !process.env.HOT_SMOKE_URL }, async () => {
  let ready = false;
  for (let attempt = 0; attempt < 60 && !ready; attempt++) {
    try { ready = (await fetch(`${process.env.HOT_SMOKE_URL}/actuator/health/readiness`)).ok; } catch { /* Wait for local startup only. */ }
    if (!ready) await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Stub backend must report ready before exercising the client');
  const memory = new Map();
  const errors = load('src/services/hotApi.ts', {});
  const contracts = load('src/services/contracts.ts', {});
  const http = load('src/services/httpClient.ts', { '@/config/api': { apiBaseUrl: process.env.HOT_SMOKE_URL }, './hotApi': errors });
  const { liveHotApi: api } = load('src/services/liveHotApi.ts', {
    './hotApi': errors, './httpClient': http, './contracts': contracts,
    'expo-crypto': { randomUUID },
    './deviceStorage': { deviceStorage: { get: async k => memory.get(k) ?? null, set: async (k, v) => { memory.set(k, v); }, remove: async k => { memory.delete(k); } } },
  });
  const user = await api.login({ mobile: '0779876543', password: 'demo-password' });
  assert.equal(user.demonstration, true);
  assert.equal((await api.getStockAccounts()).length, 4);
  const products = await api.getProducts();
  const airtime = products.find(p => p.category === 'airtime' && p.network === 'econet');
  const order = { kind: 'airtime', network: 'econet', number: '0772000003', amount: 1, productId: airtime.id };
  const quote = await api.quote(order);
  const pending = await api.purchase(order, quote);
  assert.equal(pending.status, 'pending');
  const confirmed = await api.verifyTransaction(pending.id);
  assert.equal(confirmed.status, 'success');
  assert.equal((await api.getTransaction(confirmed.id)).reference, pending.reference);
  const bundles = await api.getBundles('netone');
  const bundleOrder = { kind: 'bundle', bundle: bundles[0], number: '0711234567' };
  assert.equal((await api.purchase(bundleOrder, await api.quote(bundleOrder))).status, 'success');
  const zesa = products.find(p => p.category === 'zesa');
  const customer = await api.verifyMeter('45217893412', zesa.id);
  const zesaOrder = { kind: 'zesa', meter: '45217893412', amount: 5, customer, notifyNumber: '0771234567', productId: zesa.id };
  const token = await api.purchase(zesaOrder, await api.quote(zesaOrder));
  assert.ok(token.token);
  const payment = products.find(p => p.category === 'payment');
  const paymentOrder = { kind: 'payment', productId: payment.id, target: '123456789', amount: 2, options: {} };
  const pin = await api.purchase(paymentOrder, await api.quote(paymentOrder));
  assert.ok(pin.pin);
  assert.ok((await api.getVault()).some(t => t.id === token.id));
  assert.ok((await api.getTransactions()).some(t => t.id === pin.id));
  assert.ok((await api.getTransactionsPage()).items.some(t => t.id === pin.id));
  assert.ok((await api.getVaultPage()).items.some(t => t.id === token.id));
  assert.equal((await api.register({})).status, 'externalOnboardingRequired');
  await api.logout();
  await assert.rejects(api.getStockAccounts());
});
