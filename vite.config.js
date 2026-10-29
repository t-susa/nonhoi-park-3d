import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 相対パスでビルド（GitHub Pagesや任意のサブパスで安全に動作）
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
