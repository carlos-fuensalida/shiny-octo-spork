// Minimal hello-world HTTP server — no framework, no dependencies.
//
// Purpose: give the Docker + Cloud Run pipeline something trivial to build,
// push, and deploy so the plumbing (auth, image build, deploy) can be proven
// end-to-end without any app-level complexity getting in the way.
//
// PORT is deliberately read from the environment, not hardcoded: Cloud Run
// injects it to match whatever --port the service was deployed with (see
// bitbucket-pipelines.yml), and the same code path works for local runs.
'use strict';

const http = require('node:http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Hello, World!\n');
});

// Only auto-start when run directly (`node server.js`) — not when required
// by the test file, which manages its own server.listen()/close().
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

module.exports = server;
