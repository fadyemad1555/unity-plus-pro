#!/usr/bin/env node
// generate-html.mjs — Creates index.html for Vercel static deployment
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const distClient = join(process.cwd(), 'dist', 'client');
const manifestPath = join(distClient, '.vite', 'manifest.json');

if (!existsSync(distClient)) {
  console.error('❌ dist/client not found.');
  process.exit(1);
}

let cssFile = '';
let entryJs = '';

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  for (const [key, value] of Object.entries(manifest)) {
    if (value.isEntry && value.file) {
      entryJs = value.file;
      if (value.css && value.css.length > 0) cssFile = value.css[0];
    }
  }
  if (!cssFile) {
    for (const [key, value] of Object.entries(manifest)) {
      if (value.file && value.file.includes('styles')) {
        cssFile = value.file;
        break;
      }
    }
  }
}

// Fallback: scan assets
const assetsDir = join(distClient, 'assets');
if (existsSync(assetsDir)) {
  const files = readdirSync(assetsDir);
  if (!cssFile) {
    const css = files.find(f => f.startsWith('styles') && f.endsWith('.css'));
    if (css) cssFile = 'assets/' + css;
  }
  if (!entryJs) {
    // Pick the LARGEST js file (the main bundle)
    const jsFiles = files
      .filter(f => f.endsWith('.js'))
      .map(f => ({ name: f, size: readFileSync(join(assetsDir, f)).length }))
      .sort((a, b) => b.size - a.size);
    if (jsFiles.length > 0) entryJs = 'assets/' + jsFiles[0].name;
  }
}

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
    <title>ShopERP — Modern E-commerce + ERP</title>
    <meta name="description" content="Bilingual e-commerce storefront powered by an integrated ERP system." />
    <meta name="theme-color" content="#131921" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/favicon.ico" />
    ${cssFile ? `<link rel="stylesheet" crossorigin href="/${cssFile}" />` : ''}
  </head>
  <body>
    <script>
      // Provide minimal SSR options so TanStack Start doesn't wait for server-rendered state
      window.__TSS_START_OPTIONS__ = { serializationAdapters: [], defaultSsr: false };
      window.$_TSR = { h: function() {} };
    </script>
    ${entryJs ? `<script type="module" crossorigin src="/${entryJs}"></script>` : ''}
  </body>
</html>`;

writeFileSync(join(distClient, 'index.html'), html);
console.log('✅ Generated dist/client/index.html');
console.log('   CSS :', cssFile || '(not found)');
console.log('   JS  :', entryJs || '(not found)');
