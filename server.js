// server.js
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

  // Inicializar Socket.IO
  initializeSocket(server);

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`\n🎮 ===================================`);
    console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
    console.log(`\n📱 Comparte este enlace con otros jugadores:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n🎮 ===================================\n`);
  });
});
