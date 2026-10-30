import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
await mkdir('docs', {recursive:true});
await build({entryPoints:['src/page.tsx'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:'.build/page.mjs',jsx:'automatic'});
const {default: Page}=await import('./.build/page.mjs');
const css=await readFile('.build/page.css','utf8');
await writeFile('docs/style.css', 'html{scroll-behavior:smooth}body{margin:0}'+css);
await writeFile('docs/index.html', '<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Мотивация РОП — рост команды | До Нуля</title><link rel="stylesheet" href="./style.css"></head><body>'+renderToStaticMarkup(createElement(Page))+'</body></html>');
await writeFile('docs/.nojekyll','');

await mkdir('docs/dashboard', {recursive:true});
await build({entryPoints:['src/dashboard/App.tsx'],bundle:true,platform:'browser',format:'esm',minify:true,outfile:'docs/dashboard/app.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
await writeFile('docs/dashboard/logo.svg',await readFile('src/dashboard/logo.svg'));
await writeFile('docs/dashboard/index.html','<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Моя зарплата · РОП · До Нуля</title><link rel="stylesheet" href="./app.css"></head><body><div id="root"></div><noscript>Для калькулятора включите JavaScript. <a href="../">Правила мотивации</a></noscript><script type="module" src="./app.js"></script></body></html>');
