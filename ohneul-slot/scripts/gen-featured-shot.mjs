#!/usr/bin/env node
/**
 * 카피 얹은 피처드 스크린샷 1장 (636x1048). 상단 카피 + 앱 화면 카드.
 *   node scripts/gen-featured-shot.mjs
 * 출력: brand/screenshots/featured.png
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'brand/screenshots/02-result.png'); // 결과(당첨) 화면
const OUT = join(ROOT, 'brand/screenshots/featured.png');
const FONT = 'Apple SD Gothic Neo, AppleGothic, sans-serif';
const HEADLINE = '5초 만에 오늘 점심 결정!';

const sharp = (await import('sharp').catch(() => { console.error('sharp 미설치 — npm i -D sharp'); process.exit(1); })).default;

const shotUri = `data:image/png;base64,${readFileSync(SRC).toString('base64')}`;
// 앱 화면 카드 배치
const card = { x: 68, y: 208, w: 500, h: 824, r: 32 };

const svg = `<svg width="636" height="1048" viewBox="0 0 636 1048" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF8A4C"/><stop offset="1" stop-color="#F2540B"/>
    </linearGradient>
    <clipPath id="card"><rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="${card.r}"/></clipPath>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
  </defs>
  <rect width="636" height="1048" fill="url(#bg)"/>
  <!-- 카피 -->
  <g font-family="${FONT}" fill="#FFFFFF" text-anchor="middle">
    <rect x="218" y="60" width="200" height="50" rx="25" fill="rgba(255,255,255,0.18)"/>
    <text x="318" y="94" font-size="27" font-weight="700">점심 결정 슬롯</text>
    <text x="318" y="168" font-size="50" font-weight="800">${HEADLINE}</text>
  </g>
  <!-- 앱 화면 카드(그림자 + 둥근 모서리) -->
  <rect x="${card.x}" y="${card.y + 8}" width="${card.w}" height="${card.h}" rx="${card.r}" fill="rgba(0,0,0,0.28)" filter="url(#sh)"/>
  <image href="${shotUri}" x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#card)"/>
  <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="${card.r}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log('✓ brand/screenshots/featured.png');
