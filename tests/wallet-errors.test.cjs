const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => dependencies[name] });
  return exports;
}

test('balance failure keeps successful account sections and exposes a safe support reference', async () => {
  const { ApiError } = load('src/services/hotApi.ts', {});
  const { refreshWallet, walletStore } = load('src/state/walletStore.ts', {
    '@/services/hotApi': { ApiError },
    '@/services': { errorMessage: () => 'Request failed', api: {
      getStockAccounts: async () => { throw new ApiError('private provider body', 'UNVERIFIED_PROVIDER_SCHEMA', 502, 'ref-123'); },
      getTransactions: async () => [{ id: 'tx-1' }],
      getNotifications: async () => [],
      getVault: async () => [],
    } },
    './createStore': { createStore: initial => {
      let state = initial;
      return { get: () => state, set: patch => { state = { ...state, ...patch }; } };
    } },
  });
  await refreshWallet();
  const state = walletStore.get();
  assert.match(state.error, /balance response could not be read/);
  assert.match(state.error, /ref-123/);
  assert.doesNotMatch(state.error, /private/);
  assert.equal(state.transactions[0].id, 'tx-1');
  assert.equal(state.loading, false);
});
