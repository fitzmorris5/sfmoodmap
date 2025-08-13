import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const filePath = path.resolve(root, 'src/og-template.html');
  const stats = {};
  const url = `file://${filePath}?stats=${encodeURIComponent(JSON.stringify(stats))}`;
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const out = path.resolve(root, 'public/share/daily.png');
  await page.screenshot({ path: out });
  await browser.close();
  console.log('Wrote', out);
}

main().catch((e) => { console.error(e); process.exit(1); });
