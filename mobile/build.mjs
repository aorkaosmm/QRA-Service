// 모바일 시안을 한 파일(HTML)로 묶는다: JS 번들 + CSS + 도트 글꼴(base64)을 모두 안에 넣음.
// 결과: dist/calendar-rpg-mobile.html (외부에서 불러오는 것은 Google Fonts의 Noto Sans KR 뿐)
// 사용: npm install && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktop = path.join(here, '..', 'desktop');
const out = path.join(here, 'dist', 'calendar-rpg-mobile.html');

// 1) JS
const js = (await esbuild.build({
  entryPoints: [path.join(here, 'mobile.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
  legalComments: 'none',
})).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// 2) CSS + 글꼴
const fontURI = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(desktop, 'assets', 'fonts', file)).toString('base64')}`;
let css = [
  path.join(desktop, 'src/renderer/shared/base.css'),
  path.join(desktop, 'src/renderer/widget/widget.css'),
  path.join(here, 'mobile.css'),
].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
css = css.replace(/url\('\.\.\/\.\.\/\.\.\/assets\/fonts\/([^']+)'\)/g, (_, file) => `url('${fontURI(file)}')`);
css = (await esbuild.transform(css, { loader: 'css', minify: true })).code;

// 3) HTML 조각 (게시 환경이 doctype·head·body 뼈대를 씌우므로 내용만)
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const pick = (re) => (html.match(re) || [''])[0];
const title = pick(/<title>[\s\S]*?<\/title>/);
const sides = pick(/<meta name="claude:viewport-fit-sides"[^>]*>/);
const fonts = [...html.matchAll(/<link rel="(?:preconnect|stylesheet)" href="https:\/\/fonts\.[^>]*>/g)].map((m) => m[0]).join('\n');
let body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
body = body.replace(/<!-- build:js -->[\s\S]*?<!-- endbuild -->/, () => `<script>${js}</script>`);

const page = `${title}\n${sides}\n${fonts}\n<style>${css}</style>\n${body.trim()}\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log(`${path.relative(here, out)} · ${(page.length / 1024).toFixed(0)} KB`);
