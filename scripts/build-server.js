import { build } from 'esbuild';

await build({
  entryPoints: ['server.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  external: ['express'],
  minify: true,
});

console.log('Server built successfully: dist/index.cjs');
