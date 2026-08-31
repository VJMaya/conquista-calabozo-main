const http = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocket } = require('./lib/socket-server');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  initializeSocket(server);

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`\n===================================`);
    console.log(`Conquest of the Dungeon V5`);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Share this link with other players:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
    console.log(`===================================\n`);
  });
});
