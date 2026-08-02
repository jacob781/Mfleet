import React from 'react';

export type SortState = { key: string; dir: 'asc' | 'desc' } | null;

/** Comparator for one sortable column. It owns the direction so that blanks can
 *  stay at the bottom whichever way the column is sorted. */
export type Comparator<T> = (a: T, b: T, dir: number) => number;

/**
 * Text search + column sort over rows already in memory. The admin lists aren't
 * paginated, so a keystroke costs a re-render and no request — no debounce needed.
 * `text` must return exactly the columns on screen: searching drawer-only fields
 * would hit rows whose match the manager cannot see.
 */
export function useListView<T>(
  rows: T[],
  text: (row: T) => Array<string | number | null | undefined>,
  compare: Record<string, Comparator<T>>,
) {
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<SortState>(null);

  // Type anywhere on the list and the search box takes over — no click first.
  // Attach `searchRef` to the search input. Deliberately inert while a drawer or
  // dialog is up, while another field has focus, or with a shortcut key held, so
  // typing never lands somewhere the manager cannot see. Esc undoes a stray start.
  const searchRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('[data-overlay-open]')) return;
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
      if (e.key === 'Escape' && el === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
        return;
      }
      // Single printable characters only — Tab, Enter, F5 and the arrows stay theirs.
      if (typing || e.key.length !== 1) return;
      searchRef.current?.focus();   // the keypress itself then lands in the box
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Click cycles ascending -> descending -> back to the server's order.
  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = !q ? rows : rows.filter((r) => text(r).join(' ').toLowerCase().includes(q));
    const cmp = sort && compare[sort.key];
    if (!cmp) return found;
    const dir = sort!.dir === 'asc' ? 1 : -1;
    return [...found].sort((a, b) => cmp(a, b, dir));
    // `text`/`compare` are rebuilt every render by design — the rows drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, sort]);

  return { query, setQuery, sort, toggleSort, visible, searchRef };
}

/** Case-insensitive text sort; digits compare numerically ("2" before "10") and
 *  empty values sink to the bottom in both directions. */
export const byText = <T,>(get: (row: T) => string | null | undefined): Comparator<T> =>
  (a, b, dir) => {
    const x = get(a) ?? '', y = get(b) ?? '';
    if (!x !== !y) return x ? -1 : 1;
    return dir * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  };

export const byNumber = <T,>(get: (row: T) => number): Comparator<T> =>
  (a, b, dir) => dir * (get(a) - get(b));

/** Clickable column header with the current sort arrow. */
export const SortHeader: React.FC<{
  label: string;
  col: string;
  sort: SortState;
  onSort: (col: string) => void;
}> = ({ label, col, sort, onSort }) => (
  <th className="px-4 py-3">
    <button
      type="button"
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-mfleet-gray-dark"
    >
      {label}
      <span className={sort?.key === col ? '' : 'text-gray-300'}>
        {sort?.key === col && sort.dir === 'desc' ? '▼' : '▲'}
      </span>
    </button>
  </th>
);

/** "12 drivers" / "3 of 12 drivers" — the second form only while a filter narrows it. */
export const ListCount: React.FC<{ visible: number; total: number; noun: string }> = ({
  visible, total, noun,
}) => (
  <div className="ml-auto flex items-center text-sm text-mfleet-gray">
    {visible === total ? `${total} ${noun}` : `${visible} of ${total} ${noun}`}
  </div>
);
