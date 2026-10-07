const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

let server;
let base;

before(async () => {
  const team = [
    { name: 'Ada', role: 'Platform', status: 'shipping' },
    { name: 'Grace', role: 'Security', status: 'reviewing' },
  ];
  server = createApp(team).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('renders the status board', async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.match(html, /Team status board/);
  assert.match(html, /Grace/);
});

test('filters the team by status', async () => {
  const res = await fetch(`${base}/api/team?status=reviewing`);
  const body = await res.json();
  assert.strictEqual(body.count, 1);
  assert.strictEqual(body.members[0].name, 'Grace');
});

test('updates a member', async () => {
  const res = await fetch(`${base}/api/team/Ada`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'on vacation' }),
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, 'on vacation');
});

test('health check responds', async () => {
  const res = await fetch(`${base}/healthz`);
  assert.strictEqual((await res.json()).ok, true);
});
