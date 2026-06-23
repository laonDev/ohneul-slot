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
 *   node scripts/gen-menu-images.mjs --run --categories  # 카테고리 제너릭 아이콘 8종(_cat-*.webp)
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
const DESC_FILE = join(__dirname, 'menu-prompts.json'); // id → 영어 시각 묘사(있으면 사용)

let DESCRIPTIONS = {};
try { DESCRIPTIONS = JSON.parse(readFileSync(DESC_FILE, 'utf8')); } catch { /* 없으면 메뉴명만 사용 */ }

const API_URL = 'https://external.api.recraft.ai/v1/images/generations';
const RMBG_URL = 'https://external.api.recraft.ai/v1/images/removeBackground';
const COST_PER_IMAGE = 0.05; // USD, 생성+배경제거 합산 참고용

// ── 인자 파싱 ───────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const RUN = has('--run');
const SYNC_ONLY = has('--sync');
const CATEGORIES_MODE = has('--categories'); // 카테고리 제너릭 아이콘 생성
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
const TRANSPARENT = (process.env.RECRAFT_TRANSPARENT || '1') !== '0'; // 기본: 배경 제거(투명)

const CATEGORY_LABEL = {
  korean: 'Korean', chinese: 'Chinese', western: 'Western', japanese: 'Japanese',
  bunsik: 'Korean street food', soloeat: 'simple solo-meal', meeting: 'Korean dinner/grill',
};

// 카테고리 제너릭 아이콘(롱테일 폴백). 파일명: _cat-<key>.webp
const CATEGORY_ICONS = [
  { key: 'korean', desc: 'a representative Korean meal set: a bowl of steamed white rice beside a small red kimchi stew in a pot and a few colorful banchan side dishes' },
  { key: 'chinese', desc: 'a representative Chinese meal: a bowl of black-bean jjajangmyeon noodles next to a small plate of dumplings' },
  { key: 'western', desc: 'a representative Western meal: a round white plate of food with a fork and knife crossed, like pasta or steak' },
  { key: 'japanese', desc: 'a representative Japanese meal: an assortment of colorful nigiri sushi pieces arranged on a wooden board' },
  { key: 'bunsik', desc: 'a representative Korean street-food set: spicy red tteokbokki rice cakes with a roll of sliced kimbap' },
  { key: 'soloeat', desc: 'a single convenience-store style Korean lunch box (dosirak) with rice and a few small compartments' },
  { key: 'meeting', desc: 'a Korean barbecue dinner: pork belly grilling on a round tabletop grill with a small soju bottle and glass' },
  { key: 'default', desc: 'a generic appetizing plate of food with a fork and spoon, neutral and simple' },
];

// 공통 스타일 래퍼(메뉴/카테고리 동일 톤)
function styleWrap(subject) {
  return `A detailed appetizing food illustration of ${subject}, served in its own bowl or plate with only its natural garnish and utensils (e.g. chopsticks), semi-realistic style with glossy soft shading and a subtle drop shadow beneath, viewed from a slight overhead three-quarter angle, fully isolated on a plain pure white background with absolutely no table, scenery, or extra props, centered, no text, rich realistic food colors, recognizable authentic ingredients true to the real dish`;
}

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
  const desc = DESCRIPTIONS[menu.id];
  // 묘사가 있으면 그것을 주제로(식별 가능), 없으면 메뉴명만
  return styleWrap(desc ? desc : `"${menu.name}", a ${label} dish`);
}

// ── 매니페스트 동기화 (메뉴 id + 카테고리 키 둘 다) ───────────
function syncManifest() {
  const files = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter((f) => f.endsWith('.webp')) : [];
  const menuIds = files.filter((f) => !f.startsWith('_')).map((f) => f.replace(/\.webp$/, '')).sort();
  const catKeys = files.filter((f) => f.startsWith('_cat-')).map((f) => f.replace(/^_cat-/, '').replace(/\.webp$/, '')).sort();
  let src = readFileSync(MANIFEST_TS, 'utf8');
  const menuArr = menuIds.length ? `\n${menuIds.map((id) => `  '${id}',`).join('\n')}\n` : '\n  // 아직 없음 — 준비되는 대로 id 추가\n';
  const catArr = catKeys.length ? `\n${catKeys.map((k) => `  '${k}',`).join('\n')}\n` : "\n  // 예: 'korean', 'chinese', ... (아직 없음 — 준비되면 추가)\n";
  src = src.replace(/MENU_IMAGE_IDS = new Set<string>\(\[[\s\S]*?\]\)/, `MENU_IMAGE_IDS = new Set<string>([${menuArr}])`);
  src = src.replace(/CATEGORY_IMAGE_CATS = new Set<string>\(\[[\s\S]*?\]\)/, `CATEGORY_IMAGE_CATS = new Set<string>([${catArr}])`);
  writeFileSync(MANIFEST_TS, src);
  console.log(`🔄 매니페스트 동기화: 메뉴 ${menuIds.length}개, 카테고리 ${catKeys.length}개`);
}

// ── 생성 1건 (id로 저장, prompt로 생성) ─────────────────────
async function generateOne(id, prompt, sharp) {
  const body = { prompt, model: 'recraftv3', size: SIZE, n: 1 };
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
      let buf = Buffer.from(await (await fetch(url)).arrayBuffer());

      // 배경 제거(투명) — 음식 속 흰 요소(밥/계란)는 보존하고 배경만 제거
      if (TRANSPARENT) {
        const fd = new FormData();
        fd.append('file', new Blob([buf], { type: 'image/png' }), 'in.png');
        fd.append('response_format', 'url');
        const rb = await fetch(RMBG_URL, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: fd });
        if (!rb.ok) throw new Error(`removeBackground HTTP ${rb.status} ${(await rb.text()).slice(0, 200)}`);
        const rbJson = await rb.json();
        const finalUrl = rbJson?.image?.url || rbJson?.data?.[0]?.url || rbJson?.url;
        if (!finalUrl) throw new Error('removeBackground 응답 URL 없음: ' + JSON.stringify(rbJson).slice(0, 150));
        buf = Buffer.from(await (await fetch(finalUrl)).arrayBuffer());
      }

      await sharp(buf).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 82, alphaQuality: 90 }).toFile(join(OUT_DIR, `${id}.webp`));
      return true;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * attempt)); // 백오프
    }
  }
  console.error(`  ✗ ${id}: ${lastErr?.message}`);
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

// 생성 대상을 {id, label, prompt} 목록으로 통일
function buildTargets() {
  if (CATEGORIES_MODE) {
    let cats = CATEGORY_ICONS;
    if (ONLY.length) cats = cats.filter((c) => ONLY.includes(c.key));
    if (!FORCE) cats = cats.filter((c) => !existsSync(join(OUT_DIR, `_cat-${c.key}.webp`)));
    return cats.map((c) => ({ id: `_cat-${c.key}`, label: `[cat] ${c.key}`, prompt: styleWrap(c.desc) }));
  }
  let menus = parseMenus();
  if (CATEGORY) menus = menus.filter((m) => m.category === CATEGORY);
  if (ONLY.length) menus = menus.filter((m) => ONLY.includes(m.id));
  if (!FORCE) menus = menus.filter((m) => !existsSync(join(OUT_DIR, `${m.id}.webp`)));
  if (SAMPLES) menus = menus.slice(0, SAMPLES);
  if (LIMIT) menus = menus.slice(0, LIMIT);
  return menus.map((m) => ({ id: m.id, label: `${m.id} ${m.name}`, prompt: promptFor(m) }));
}

// ── 메인 ────────────────────────────────────────────────────
async function main() {
  if (SYNC_ONLY) { syncManifest(); return; }

  const targets = buildTargets();

  console.log(`대상: ${targets.length}개${CATEGORIES_MODE ? ' (카테고리)' : ''} / 스타일: ${STYLE_ID ? `style_id=${STYLE_ID}` : `${STYLE}${SUBSTYLE ? '/' + SUBSTYLE : ''}`} / 크기: ${SIZE}`);
  console.log(`예상 비용(참고): ~$${(targets.length * COST_PER_IMAGE).toFixed(2)} (재시도 제외)`);

  if (!RUN) {
    console.log('\n[DRY-RUN] 실제 생성하려면 --run 추가. 미리보기 5개 프롬프트:');
    targets.slice(0, 5).forEach((t) => console.log(`  ${t.label}\n    → ${t.prompt}`));
    if (targets.length === 0) console.log('  (생성할 대상 없음 — 이미 다 있거나 필터 결과 0)');
    return;
  }

  if (!TOKEN) { console.error('환경변수 RECRAFT_API_TOKEN 가 필요합니다.'); process.exit(1); }
  let sharp;
  try { sharp = (await import('sharp')).default; }
  catch { console.error("sharp 미설치 — 실행: npm i -D sharp"); process.exit(1); }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  if (targets.length === 0) { console.log('생성할 대상이 없습니다.'); syncManifest(); return; }

  const ok = await runPool(targets, (t) => generateOne(t.id, t.prompt, sharp));
  console.log(`완료: ${ok}/${targets.length} 생성`);
  syncManifest();
}

main().catch((e) => { console.error(e); process.exit(1); });
