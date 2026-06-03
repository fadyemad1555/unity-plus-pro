import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsConfigPaths from 'vite-tsconfig-paths';

// Try TanStack Start plugin directly
let tanstackPlugin: any;
let nitroPlugin: any;

try {
  const { tanstackStart } = await import('@tanstack/react-start/plugin/vite');
  tanstackPlugin = tanstackStart({ server: { entry: 'src/server' } });
} catch (e) {
  console.warn('tanstackStart plugin not found, skipping');
}

try {
  const { nitro } = await import('nitro/vite');
  nitroPlugin = nitro();
} catch (e) {
  console.warn('nitro plugin not found, skipping');
}

const plugins = [
  tanstackPlugin,
  nitroPlugin,
  viteReact(),
  tailwindcss(),
  tsConfigPaths(),
].filter(Boolean);

export default defineConfig({ plugins });
