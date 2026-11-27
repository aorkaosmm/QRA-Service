// 네이티브 대역으로 app.js 를 묶어 www-test/ 에 만든다
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const out = path.join(root, 'www-test');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'www'), out, { recursive: true });
const stub = (f) => path.join(here, 'stubs', f);
await esbuild.build({
  entryPoints: [path.join(root, 'web', 'app.js')],
  bundle: true, format: 'iife', outfile: path.join(out, 'app.js'), logLevel: 'warning',
  alias: {
    '@capacitor/core': stub('core.js'),
    '@capacitor/preferences': stub('preferences.js'),
    '@capacitor/app': stub('app.js'),
    '@capacitor/local-notifications': stub('notifications.js'),
  },
});
console.log('www-test ready');
