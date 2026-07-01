import { useState } from 'react';
import type { Menu } from '../core/types';
import { searchMenus } from '../core/menu';
import { makeCustomMenu } from '../core/customSet';
import { MenuIcon } from './MenuIcon';

export function MenuSearch({ onAdd }: { onAdd: (menu: Menu) => void }) {
  const [tab, setTab] = useState<'pool' | 'free'>('pool');
  const [q, setQ] = useState('');
  const results = tab === 'pool' ? searchMenus(q) : [];

  function addFree() {
    const v = q.trim();
    if (!v) return;
    onAdd(makeCustomMenu(v));
    setQ('');
  }

  return (
    <div className="menu-search">
      <div className="ms-tabs">
        <button type="button" className={tab === 'pool' ? 'on' : ''} onClick={() => setTab('pool')}>내장에서 찾기</button>
        <button type="button" className={tab === 'free' ? 'on' : ''} onClick={() => setTab('free')}>직접 입력</button>
      </div>
      {tab === 'pool' ? (
        <>
          <input className="ms-input" placeholder="메뉴 검색 (예: 국밥)" value={q} onChange={e => setQ(e.target.value)} />
          <div className="ms-results">
            {results.map(m => (
              <button type="button" key={m.id} className="ms-chip" onClick={() => onAdd(m)}>
                <MenuIcon menu={m} size={20} /> {m.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <form className="ms-free" onSubmit={e => { e.preventDefault(); addFree(); }}>
          <input className="ms-input" placeholder="메뉴 이름 직접 입력" value={q} onChange={e => setQ(e.target.value)} />
          <button type="submit" className="ms-add">추가</button>
        </form>
      )}
    </div>
  );
}
