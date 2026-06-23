#!/usr/bin/env node
/**
 * 스토어 썸네일/배너 생성 (1932x828). 좌측 카피 + 우측 슬롯 비주얼.
 *   node scripts/gen-thumbnail.mjs
 * 출력: brand/thumbnail-1932x828.png
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MENU_DIR = join(ROOT, 'public/menu');
const OUT_DIR = join(ROOT, 'brand');
const FONT = 'Apple SD Gothic Neo, AppleGothic, sans-serif';
const REELS = ['k01', 'k05', 'k06']; // 김치찌개 / 비빔밥 / 불고기

const sharp = (await import('sharp').catch(() => { console.error('sharp 미설치 — npm i -D sharp'); process.exit(1); })).default;

async function dataUri(id) {
  const buf = await sharp(join(MENU_DIR, `${id}.webp`)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function slotGroup(uris) {
  const cx = 1500, cy = 414;
  const panel = { w: 620, h: 360, r: 50 };
  panel.x = cx - panel.w / 2; panel.y = cy - panel.h / 2;
  const side = { w: 150, h: 200 }, hero = { w: 210, h: 270 }, gap = 18, pad = 12;
  const totalW = side.w * 2 + hero.w + gap * 2;
  const x0 = panel.x + (panel.w - totalW) / 2;
  const cells = [
    { x: x0, y: cy - side.h / 2, w: side.w, h: side.h, center: false },
    { x: x0 + side.w + gap, y: cy - hero.h / 2, w: hero.w, h: hero.h, center: true },
    { x: x0 + side.w + gap + hero.w + gap, y: cy - side.h / 2, w: side.w, h: side.h, center: false },
  ];
  return `
  <rect x="${panel.x + 40}" y="${panel.y - 30}" width="${panel.w - 80}" height="44" rx="22" fill="url(#frame)"/>
  <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" rx="${panel.r}" fill="#FFFFFF"/>
  ${cells.map((c, i) => `
    <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="24" fill="${c.center ? '#FFF1E8' : '#F4F5F7'}" ${c.center ? 'stroke="#FF6B35" stroke-width="8"' : ''}/>
    <image href="${uris[i]}" x="${c.x + pad}" y="${c.y + pad}" width="${c.w - pad * 2}" height="${c.h - pad * 2}" preserveAspectRatio="xMidYMid meet"/>`).join('')}
  <circle cx="${panel.x - 26}" cy="${cy}" r="12" fill="#FFD24C"/>
  <circle cx="${panel.x + panel.w + 26}" cy="${cy}" r="12" fill="#FFD24C"/>`;
}

function buildSvg(uris) {
  return `<svg width="1932" height="828" viewBox="0 0 1932 828" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF8A4C"/><stop offset="1" stop-color="#F2540B"/>
    </linearGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFD24C"/><stop offset="1" stop-color="#FFB020"/>
    </linearGradient>
  </defs>
  <rect width="1932" height="828" fill="url(#bg)"/>
  <!-- 좌측 카피 -->
  <g font-family="${FONT}" fill="#FFFFFF">
    <rect x="150" y="196" width="270" height="64" rx="32" fill="rgba(255,255,255,0.18)"/>
    <text x="186" y="240" font-size="34" font-weight="700" fill="#FFFFFF">점심 결정 슬롯</text>
    <text x="150" y="430" font-size="150" font-weight="800">오늘 뭐먹지</text>
    <text x="150" y="585" font-size="150" font-weight="800" fill="#FFE08A">슬롯</text>
    <text x="150" y="680" font-size="48" font-weight="600" fill="#FFF3EC">메뉴 고민 끝 — 돌리면 5초 만에 결정!</text>
  </g>
  <!-- 우측 슬롯 비주얼 -->
  ${slotGroup(uris)}
</svg>`;
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const uris = await Promise.all(REELS.map(dataUri));
  await sharp(Buffer.from(buildSvg(uris))).png().toFile(join(OUT_DIR, 'thumbnail-1932x828.png'));
  console.log('✓ brand/thumbnail-1932x828.png');
}

main().catch((e) => { console.error(e); process.exit(1); });
