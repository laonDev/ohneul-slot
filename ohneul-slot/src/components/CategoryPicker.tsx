import type { CategoryId } from '../core/types';
import { CATEGORIES } from '../data/categories';

interface Props { value: CategoryId; onChange: (id: CategoryId) => void; }

export function CategoryPicker({ value, onChange }: Props) {
  return (
    <div className="category-row">
      {CATEGORIES.map(c => (
        <button
          key={c.id}
          type="button"
          className={`chip ${value === c.id ? 'chip--on' : ''}`}
          onClick={() => onChange(c.id)}
          aria-pressed={value === c.id}
        >
          <span>{c.emoji}</span> {c.label}
        </button>
      ))}
    </div>
  );
}
