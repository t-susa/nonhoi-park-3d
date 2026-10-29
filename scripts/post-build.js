import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexPath)) {
  const htmlContent = fs.readFileSync(indexPath, 'utf-8');

  // 1. ランダムなHTMLファイル名
  const randomFileName = 'nh-k7v9m2x4.html';
  fs.writeFileSync(path.join(distDir, randomFileName), htmlContent);
  console.log(`✓ Created randomized file: dist/${randomFileName}`);

  // 2. シークレットディレクトリ
  const secretDir = path.join(distDir, 'v-secret-8a2f');
  if (!fs.existsSync(secretDir)) {
    fs.mkdirSync(secretDir, { recursive: true });
  }
  // 相対パスの調整（サブディレクトリからの場合 assets へのパスを ../assets に変更）
  const subHtml = htmlContent.replaceAll('./assets/', '../assets/').replaceAll('assets/', '../assets/');
  fs.writeFileSync(path.join(secretDir, 'index.html'), subHtml);
  console.log(`✓ Created secret directory: dist/v-secret-8a2f/index.html`);

  // 3. 404.html (GitHub Pages用)
  fs.writeFileSync(path.join(distDir, '404.html'), htmlContent);
  console.log(`✓ Created dist/404.html`);

  // 4. .nojekyll (GitHub Pagesが_や特殊文字を無視しないようにする)
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  console.log(`✓ Created dist/.nojekyll`);
} else {
  console.error('dist/index.html not found');
}
