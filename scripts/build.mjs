import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const output = path.resolve(root, 'dist');
if (output !== path.join(root, 'dist')) throw Error('Unexpected output path');

const copyTree = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, entry.name);
    const b = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTree(a, b);
    else if (entry.isFile()) fs.copyFileSync(a, b);
    else throw Error('Unsupported source entry');
  }
};
copyTree('site', output);

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
  );

// ---------- 1. GA4（Google Analytics 4）埋点注入 ----------
// 站点所有页面均为静态 HTML，构建时统一注入到 </head> 前；已注入过的页面跳过。
// __forms.html 是 Netlify Forms 的提交目标页，不是可访问页面，不注入。
const GA_MEASUREMENT_ID = 'G-8HQL8JJWPZ';
const gaSnippet =
  `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>` +
  `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}` +
  `gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');</script>`;

for (const f of walk(output).filter((f) => f.endsWith('.html') && path.basename(f) !== '__forms.html')) {
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes(GA_MEASUREMENT_ID)) continue;
  if (!html.includes('</head>')) continue;
  fs.writeFileSync(f, html.replace('</head>', gaSnippet + '</head>'));
}

// ---------- 2. 域名替换：占位域名 -> 正式域名 ----------
// 由 netlify.toml 的 SITE_URL 驱动（= https://corerims.com）。
// 影响 canonical、hreflang、sitemap、robots 等全部绝对 URL。
const domain = process.env.SITE_URL || process.env.URL;
if (domain) {
  const u = new URL(domain);
  if (!['http:', 'https:'].includes(u.protocol)) throw Error('Invalid SITE_URL');
  const origin = u.origin;
  for (const f of walk(output).filter((f) => /\.(html|xml|txt)$/.test(f))) {
    const text = fs.readFileSync(f, 'utf8');
    const next = text.replaceAll('https://equipment-wheel-supply.joylee624.chatgpt.site', origin);
    if (next !== text) fs.writeFileSync(f, next);
  }
  console.log('Domain origin applied to all absolute URLs: ' + origin);
}

console.log('Built static site in dist. Enable Netlify form detection and deploy to accept submissions.');
