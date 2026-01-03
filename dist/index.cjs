const handler = require('serve-handler');
const http = require('http');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  return handler(req, res, {
    public: __dirname,
    rewrites: [{ source: '**', destination: '/index.html' }]
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Shufti running on port ${PORT}`);
});
