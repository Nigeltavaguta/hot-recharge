// Local simulated-provider recovery drill. Never targets a real financial service.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const base = process.env.HOT_SMOKE_URL;
assert.ok(base && ['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Use an isolated loopback stub backend');
const fixture = path.join(__dirname, '../.tools/restart-fixture.json');
async function run() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/actuator/health/readiness`)).ok) break; } catch { /* Startup only */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const loginResponse = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: '0779876542', password: 'demo-password' }) });
  assert.ok(loginResponse.ok);
  const session = await loginResponse.json();
  assert.equal(session.demonstration, true, 'Refuse purchases against a non-demonstration backend');
  async function call(route, body, key) {
    const response = await fetch(`${base}/api${route}`, { method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body) });
    assert.ok(response.ok, `Unexpected status ${response.status} at ${route}`);return response.json();
  }
  if (process.argv[2] === 'before') {
    const quote = await call('/quotes', { productId: 'demo-airtime-econet', target: '0772000003', amount: '1.00' });
    const key = randomUUID();
    const tx = await call('/recharge/airtime', { quoteId: quote.id }, key);
    assert.equal(tx.status, 'pending');
    fs.writeFileSync(fixture, JSON.stringify({ key, quoteId: quote.id, id: tx.id, reference: tx.reference }));
    console.log('Pending demonstration intent persisted. Restart the local backend, then run the after phase.');
  } else {
    assert.equal(process.argv[2], 'after');
    const saved = JSON.parse(fs.readFileSync(fixture, 'utf8'));
    const lookup = await call(`/purchase-intents/${saved.key}`);
    assert.equal(lookup.transactionId, saved.id);
    const confirmed = await call(`/transactions/${saved.id}/verify`, {});
    assert.equal(confirmed.status, 'success');assert.equal(confirmed.reference, saved.reference);
    const replay = await call('/recharge/airtime', { quoteId: saved.quoteId }, saved.key);
    assert.equal(replay.id, saved.id);assert.equal(replay.reference, saved.reference);
    fs.unlinkSync(fixture);
    console.log('Process restart recovery passed: original intent/reference retained; same-key request resolves the original purchase.');
  }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
