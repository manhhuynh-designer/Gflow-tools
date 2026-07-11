import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig(({ command }) => {
  return {
    plugins: [react(), cssInjectedByJsPlugin()],
    resolve: {
      alias: command === 'serve' ? {
        'flow-sdk': path.resolve(__dirname, './src/mocks/flow-sdk.ts'),
      } : {},
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'main.tsx'),
        name: 'GFlowTool',
        formats: ['es'],
        fileName: 'index',
      },
      rollupOptions: {
        external: ['flow-sdk'],
      },
    },
  };
});
