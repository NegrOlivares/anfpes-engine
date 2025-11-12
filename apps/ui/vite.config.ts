import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const repoRoot = path.resolve(__dirname, '../..');
const cacheRoot = process.env.CACHE_ROOT ?? path.resolve(repoRoot, 'data/cache');

function cacheStaticPlugin(): Plugin {
  return {
    name: 'anfpes-cache-static',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/cache/')) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(req.url.replace(/^\/cache\//, ''));
        const absolutePath = path.resolve(cacheRoot, relativePath);

        if (!absolutePath.startsWith(cacheRoot)) {
          res.statusCode = 400;
          res.end('Invalid cache path');
          return;
        }

        fs.stat(absolutePath, (err, stats) => {
          if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.end('Cache file not found');
            return;
          }

          const stream = fs.createReadStream(absolutePath);
          stream.on('error', () => {
            res.statusCode = 500;
            res.end('Failed to read cache file');
          });
          stream.pipe(res);
        });
      });
    },
    async closeBundle() {
      const destination = path.resolve(__dirname, 'dist/cache');
      await fsp.rm(destination, { recursive: true, force: true });
      try {
        await fsp.cp(cacheRoot, destination, { recursive: true });
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          console.warn('[anfpes-cache-static] Cache directory not found. Skipping copy.');
          return;
        }
        throw error;
      }
    },
  };
}

export default defineConfig({
  root: __dirname,
  plugins: [react(), cacheStaticPlugin()],
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      allow: [repoRoot, cacheRoot],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
