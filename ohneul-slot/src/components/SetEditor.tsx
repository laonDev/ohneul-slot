import { useState } from 'react';
import type { CustomSet, Menu } from '../core/types';
import { canSpinSet } from '../core/customSet';
import { MenuIcon } from './MenuIcon';
import { MenuSearch } from './MenuSearch';

interface Props {
  initial: CustomSet | null;
  onSubmit: (name: string, items: Menu[], id?: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function SetEditor({ initial, onSubmit, onDelete, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [items, setItems] = useState<Menu[]>(initial?.items ?? []);
  const [adding, setAdding] = useState(false);

  function addItem(m: Menu) {
    if (items.length >= 20) return;
    if (items.some(it => it.name === m.name)) return; // 중복 이름 방지
    setItems(prev => [...prev, m]);
  }
  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  const finalName = name.trim() || '내 셋';
  const draft: CustomSet = { id: initial?.id ?? 'draft', name: finalName, items };
  const canSave = canSpinSet(draft);

  return (
    <div className="set-editor">
      <header className="se-head">
        <button type="button" onClick={onClose} aria-label="닫기">←</button>
        <span>{initial ? '셋 편집' : '셋 만들기'}</span>
        {initial
          ? <button type="button" className="se-del" onClick={() => { onDelete(initial.id); onClose(); }}>삭제</button>
          : <span style={{ width: 32 }} />}
      </header>

      <input className="set-name" placeholder="셋 이름 (예: 회사 점심)" value={name} onChange={e => setName(e.target.value)} />

      <div className="set-items">
        {items.map(it => {
          const free = it.id.startsWith('custom:');
          return (
            <div className="set-item" key={it.id}>
              <span><MenuIcon menu={it} size={22} /> {it.name} <span className={`src ${free ? 'free' : 'pool'}`}>{free ? '직접' : '내장'}</span></span>
              <button type="button" className="x" onClick={() => removeItem(it.id)} aria-label="삭제">✕</button>
            </div>
          );
        })}
      </div>

      <button type="button" className="add-item" onClick={() => setAdding(a => !a)}>
        {adding ? '닫기' : '+ 항목 추가'}
      </button>
      {adding && <MenuSearch onAdd={addItem} />}

      <button type="button" className="set-save" disabled={!canSave} onClick={() => { onSubmit(finalName, items, initial?.id); onClose(); }}>
        저장{canSave ? '' : ' (메뉴 2개 이상)'}
      </button>
    </div>
  );
}
