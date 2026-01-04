const handler = require('serve-handler');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  // Strip /builder/ prefix if present
  if (req.url && req.url.startsWith('/builder/')) {
    req.url = req.url.replace('/builder/', '/');
  } else if (req.url === '/builder') {
    req.url = '/';
  }
  
  return handler(req, res, {
    public: __dirname,
    rewrites: [{ source: '**', destination: '/index.html' }]
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Shufti running on port ${PORT}`);
});
