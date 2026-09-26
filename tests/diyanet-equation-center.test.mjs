import test from 'node:test';

test('Research equation-of-center provider agrees with an independent Python expression on 710 Julian dates', async () => {
  // This checks numerical implementation, not agreement with institutional calendars.
  // Keep the rejected candidate outside the standalone prayer-time API.
  await import('../methods/diyanet/research/equation-center/verify-center.mjs');
});
