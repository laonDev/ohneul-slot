#!/usr/bin/env node
/**
 * 메뉴 이미지 일괄 생성 스크립트 (Recraft V3)
 *
 * 메뉴(src/data/menus.ts)를 읽어 각 메뉴의 플랫 아이콘을 Recraft API로 생성하고,
 * 256x256 WebP로 public/menu/<id>.webp 에 저장한 뒤, src/data/menuImages.ts 의
 * MENU_IMAGE_IDS 를 실제 파일 기준으로 자동 동기화한다.
 *
 * 사용:
 *   export RECRAFT_API_TOKEN=...        # 필수(실제 생성 시)
 *   export RECRAFT_STYLE_ID=...         # (선택) 일관성용 커스텀 스타일 id
 *   node scripts/gen-menu-images.mjs                 # dry-run: 무엇을 만들지 목록만
 *   node scripts/gen-menu-images.mjs --run           # 실제 생성(미보유분만)
 *   node scripts/gen-menu-images.mjs --run --samples=6   # 스타일 점검용 6개만
 *   node scripts/gen-menu-images.mjs --run --category=korean
 *   node scripts/gen-menu-images.mjs --run --only=k01,k04,b01
 *   node scripts/gen-menu-images.mjs --run --force   # 기존 이미지도 재생성
 *   node scripts/gen-menu-images.mjs --sync          # 생성 없이 매니페스트만 동기화
 *
 * 환경변수(선택):
 *   RECRAFT_STYLE   기본 'digital_illustration'
 *   RECRAFT_SUBSTYLE 기본 '' (예: '2d_art_poster', 'hand_drawn_outline')
 *   RECRAFT_SIZE    기본 '1024x1024'
 *   GEN_CONCURRENCY 기본 3
 *
 * 의존성: sharp (스크립트 실행 시에만 필요). 없으면 안내 후 종료 → `npm i -D sharp`
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MENUS_TS = join(ROOT, 'src/data/menus.ts');
const MANIFEST_TS = join(ROOT, 'src/data/menuImages.ts');
const OUT_DIR = join(ROOT, 'public/menu');

const API_URL = 'https://external.api.recraft.ai/v1/images/generations';
const COST_PER_IMAGE = 0.04; // USD, Recraft V3 raster 기준(참고용)

// ── 인자 파싱 ───────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const RUN = has('--run');
const SYNC_ONLY = has('--sync');
const FORCE = has('--force');
const ONLY = (val('only', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const CATEGORY = val('category', '');
const SAMPLES = parseInt(val('samples', '0'), 10) || 0;
const LIMIT = parseInt(val('limit', '0'), 10) || 0;
const CONCURRENCY = Math.max(1, parseInt(process.env.GEN_CONCURRENCY || '3', 10));

const STYLE = process.env.RECRAFT_STYLE || 'digital_illustration';
const SUBSTYLE = process.env.RECRAFT_SUBSTYLE || '';
const STYLE_ID = process.env.RECRAFT_STYLE_ID || '';
const SIZE = process.env.RECRAFT_SIZE || '1024x1024';
const TOKEN = process.env.RECRAFT_API_TOKEN || '';

const CATEGORY_LABEL = {
  korean: 'Korean', chinese: 'Chinese', western: 'Western', japanese: 'Japanese',
  bunsik: 'Korean street food', soloeat: 'simple solo-meal', meeting: 'Korean dinner/grill',
};

// ── 메뉴 파싱 ───────────────────────────────────────────────
function parseMenus() {
  const src = readFileSync(MENUS_TS, 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*emoji:\s*'([^']*)',\s*category:\s*'([^']+)'\s*\}/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ id: m[1], name: m[2], emoji: m[3], category: m[4] });
  return out;
}

function promptFor(menu) {
  const label = CATEGORY_LABEL[menu.category] || 'food';
  return `A flat vector illustration icon of "${menu.name}", a ${label} dish, centered, top-down view, on a plain soft pastel background, minimal clean modern style, soft shadow, no text, bright appetizing colors`;
}

// ── 매니페스트 동기화 ────────────────────────────────────────
function syncManifest() {
  const ids = existsSync(OUT_DIR)
    ? readdirSync(OUT_DIR).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, '')).sort()
    : [];
  const src = readFileSync(MANIFEST_TS, 'utf8');
  const arr = ids.length ? `\n${ids.map((id) => `  '${id}',`).join('\n')}\n` : '\n  // 아직 없음 — 준비되는 대로 id 추가\n';
  const next = src.replace(/new Set<string>\(\[[\s\S]*?\]\)/, `new Set<string>([${arr}])`);
  writeFileSync(MANIFEST_TS, next);
  console.log(`🔄 매니페스트 동기화: ${ids.length}개 등록`);
}

// ── 생성 1건 ────────────────────────────────────────────────
async function generateOne(menu, sharp) {
  const body = { prompt: promptFor(menu), model: 'recraftv3', size: SIZE, n: 1 };
  if (STYLE_ID) body.style_id = STYLE_ID; else { body.style = STYLE; if (SUBSTYLE) body.substyle = SUBSTYLE; }

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      const url = json?.data?.[0]?.url;
      if (!url) throw new Error('응답에 이미지 URL 없음');
      const img = await fetch(url);
      const buf = Buffer.from(await img.arrayBuffer());
      await sharp(buf).resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 82 }).toFile(join(OUT_DIR, `${menu.id}.webp`));
      return true;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * attempt)); // 백오프
    }
  }
  console.error(`  ✗ ${menu.id} ${menu.name}: ${lastErr?.message}`);
  return false;
}

// ── 동시성 풀 ───────────────────────────────────────────────
async function runPool(items, worker) {
  let i = 0, ok = 0;
  const next = async () => {
    while (i < items.length) {
      const idx = i++;
      const done = await worker(items[idx], idx);
      if (done) ok++;
      process.stdout.write(`\r  진행: ${idx + 1}/${items.length} (성공 ${ok})   `);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, next));
  process.stdout.write('\n');
  return ok;
}

// ── 메인 ────────────────────────────────────────────────────
async function main() {
  if (SYNC_ONLY) { syncManifest(); return; }

  let menus = parseMenus();
  if (CATEGORY) menus = menus.filter((m) => m.category === CATEGORY);
  if (ONLY.length) menus = menus.filter((m) => ONLY.includes(m.id));
  if (!FORCE) menus = menus.filter((m) => !existsSync(join(OUT_DIR, `${m.id}.webp`)));
  if (SAMPLES) menus = menus.slice(0, SAMPLES);
  if (LIMIT) menus = menus.slice(0, LIMIT);

  console.log(`대상: ${menus.length}개 / 스타일: ${STYLE_ID ? `style_id=${STYLE_ID}` : `${STYLE}${SUBSTYLE ? '/' + SUBSTYLE : ''}`} / 크기: ${SIZE}`);
  console.log(`예상 비용(참고): ~$${(menus.length * COST_PER_IMAGE).toFixed(2)} (재시도 제외)`);

  if (!RUN) {
    console.log('\n[DRY-RUN] 실제 생성하려면 --run 추가. 미리보기 5개 프롬프트:');
    menus.slice(0, 5).forEach((m) => console.log(`  ${m.id} ${m.name}\n    → ${promptFor(m)}`));
    if (menus.length === 0) console.log('  (생성할 대상 없음 — 이미 다 있거나 필터 결과 0)');
    return;
  }

  if (!TOKEN) { console.error('환경변수 RECRAFT_API_TOKEN 가 필요합니다.'); process.exit(1); }
  let sharp;
  try { sharp = (await import('sharp')).default; }
  catch { console.error("sharp 미설치 — 실행: npm i -D sharp"); process.exit(1); }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  if (menus.length === 0) { console.log('생성할 대상이 없습니다.'); syncManifest(); return; }

  const ok = await runPool(menus, (m) => generateOne(m, sharp));
  console.log(`완료: ${ok}/${menus.length} 생성`);
  syncManifest();
}

main().catch((e) => { console.error(e); process.exit(1); });
