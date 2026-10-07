// Outbound HTTP helpers used by integrations (not exercised by the tests, so the
// app never makes network calls during the lab). Two HTTP clients on purpose:
// axios shows a fix that needs a bigger upgrade, node-fetch a patch-level fix.
const axios = require('axios');
const fetch = require('node-fetch');

async function postStatusToWebhook(url, payload) {
  const res = await axios.post(url, payload, { timeout: 5000 });
  return res.status;
}

async function fetchJson(url) {
  const res = await fetch(url, { timeout: 5000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

module.exports = { postStatusToWebhook, fetchJson };
