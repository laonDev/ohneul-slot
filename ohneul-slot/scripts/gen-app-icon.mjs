#!/usr/bin/env node
/**
 * 앱 아이콘 생성 (벡터 SVG → PNG).
 * 브랜드 오렌지 배경 + 슬롯 3릴(실제 음식 webp) + 가운데 당첨 강조.
 *
 *   node scripts/gen-app-icon.mjs            # 600x600 + 1024x1024 PNG 생성
 *
 * 의존성: sharp (npm i -D sharp). 출력: brand/app-icon-600.png, brand/app-icon-1024.png
 */
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MENU_DIR = join(ROOT, 'public/menu');
const OUT_DIR = join(ROOT, 'brand');

// 릴에 올릴 음식(좌/중/우). 중앙=당첨 강조. (이미 생성된 webp id)
const REELS = ['k01', 'k05', 'k06']; // 김치찌개 / 비빔밥 / 불고기

const sharp = (await import('sharp').catch(() => { console.error('sharp 미설치 — npm i -D sharp'); process.exit(1); })).default;

// 음식 webp → PNG base64 데이터 URI (SVG에 안전하게 임베드)
async function dataUri(id) {
  const buf = await sharp(join(MENU_DIR, `${id}.webp`)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function buildSvg(uris) {
  // 슬롯 패널 + 3릴(가운데 히어로 크게). 음식이 셀을 꽉 채워 작은 크기에서도 또렷.
  const panel = { x: 70, y: 165, w: 460, h: 270, r: 44 };
  const cy = panel.y + panel.h / 2; // 300
  const side = { w: 124, h: 156 };
  const hero = { w: 168, h: 208 };
  const gap = 14;
  const totalW = side.w + gap + hero.w + gap + side.w;
  const x0 = panel.x + (panel.w - totalW) / 2;
  const cells = [
    { x: x0, y: cy - side.h / 2, w: side.w, h: side.h, center: false, pad: 8 },
    { x: x0 + side.w + gap, y: cy - hero.h / 2, w: hero.w, h: hero.h, center: true, pad: 8 },
    { x: x0 + side.w + gap + hero.w + gap, y: cy - side.h / 2, w: side.w, h: side.h, center: false, pad: 8 },
  ];

  return `<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF8A4C"/><stop offset="1" stop-color="#F2540B"/>
    </linearGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFD24C"/><stop offset="1" stop-color="#FFB020"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <!-- 상단 슬롯 프레임 바 -->
  <rect x="${panel.x + 30}" y="${panel.y - 26}" width="${panel.w - 60}" height="40" rx="20" fill="url(#frame)"/>
  <!-- 슬롯 패널 -->
  <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" rx="${panel.r}" fill="#FFFFFF"/>
  ${cells.map((c, i) => `
  <g>
    <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="22" fill="${c.center ? '#FFF1E8' : '#F4F5F7'}" ${c.center ? 'stroke="#FF6B35" stroke-width="7"' : ''}/>
    <image href="${uris[i]}" x="${c.x + c.pad}" y="${c.y + c.pad}" width="${c.w - c.pad * 2}" height="${c.h - c.pad * 2}" preserveAspectRatio="xMidYMid meet"/>
  </g>`).join('')}
  <!-- 좌우 히트라인 점(슬롯 느낌) -->
  <circle cx="${panel.x - 22}" cy="${cy}" r="10" fill="#FFD24C"/>
  <circle cx="${panel.x + panel.w + 22}" cy="${cy}" r="10" fill="#FFD24C"/>
</svg>`;
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const uris = await Promise.all(REELS.map(dataUri));
  const svg = buildSvg(uris);
  for (const size of [600, 1024]) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(OUT_DIR, `app-icon-${size}.png`));
    console.log(`✓ brand/app-icon-${size}.png`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
