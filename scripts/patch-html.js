#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '../dist/index.html');

// index.htmlを読み込む
let html = fs.readFileSync(distIndexPath, 'utf8');

// manifest.jsonのリンクを適切に追加
// 既に存在するlinkタグの後に配置
const linkRegex = /<link rel="icon"[^>]*\/>/;
const match = html.match(linkRegex);

if (match && !html.includes('rel="manifest"')) {
  // icon link の直後に manifest link を追加
  html = html.replace(
    match[0],
    match[0] + '\n  <link rel="manifest" href="/manifest.json" />'
  );
}

// serviceWorkerの登録スクリプト（重複チェック）
if (!html.includes('serviceWorker')) {
  html = html.replace(
    '</body>',
    `  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('SW registered:', reg))
          .catch(err => console.log('SW registration failed:', err));
      });
    }
  </script>
</body>`
  );
}

fs.writeFileSync(distIndexPath, html, 'utf8');
console.log('✅ index.html patched successfully');
