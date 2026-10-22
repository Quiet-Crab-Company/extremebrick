const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT, 10) || 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

function listen(port) {
  server.listen(port, () => {
    console.log(`\x1b[36m========================================\x1b[0m`);
    console.log(`\x1b[32m🎮 Cyber Breakout is running!\x1b[0m`);
    console.log(`\x1b[33m👉 http://localhost:${port}\x1b[0m`);
    console.log(`\x1b[36m========================================\x1b[0m`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    PORT++;
    console.log(`Port in use, trying http://localhost:${PORT}...`);
    listen(PORT);
  } else {
    console.error('Server error:', err);
  }
});

listen(PORT);
