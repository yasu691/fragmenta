#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '../dist/index.html');

// index.htmlを読み込む
let html = fs.readFileSync(distIndexPath, 'utf8');

// manifest.jsonのリンクがまだ存在しない場合は追加
if (!html.includes('manifest.json')) {
  // <head>の末尾に追加
  html = html.replace(
    '</head>',
    '  <link rel="manifest" href="/manifest.json" />\n</head>'
  );

  // theme-colorも確認・追加
  if (!html.includes('theme-color')) {
    html = html.replace(
      '</head>',
      '  <meta name="theme-color" content="#6200ee" />\n</head>'
    );
  }

  // service workerの登録スクリプトを追加
  html = html.replace(
    '</body>',
    `  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(err => {
        console.log('Service Worker registration failed:', err);
      });
    }
  </script>
</body>`
  );

  fs.writeFileSync(distIndexPath, html, 'utf8');
  console.log('✅ index.html patched with manifest.json link');
} else {
  console.log('✅ manifest.json link already present');
}
