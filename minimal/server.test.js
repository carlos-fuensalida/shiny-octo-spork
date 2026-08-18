'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('./server.js');

test('responds with 200 and the hello-world body', async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'Hello, World!\n');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
