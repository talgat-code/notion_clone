import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

export function SearchModal({ onClose }: { onClose: () => void }) {
  const { pages, visitPage } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = Object.values(pages).filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.blocks.some((b) => b.content.toLowerCase().includes(q))
    );
  });

  function getPath(pageId: string): string {
    const parts: string[] = [];
    let cur = pages[pageId];
    while (cur?.parentId) {
      const parent = pages[cur.parentId];
      if (!parent) break;
      parts.unshift(parent.title || 'Untitled');
      cur = parent;
    }
    return parts.join(' / ');
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">No results for "{query}"</div>
          ) : (
            results.map((page) => (
              <button
                key={page.id}
                className="search-result"
                onClick={() => { visitPage(page.id); onClose(); }}
              >
                <span className="search-result-icon">{page.icon}</span>
                <div>
                  <div className="search-result-title">{page.title || 'Untitled'}</div>
                  {getPath(page.id) && (
                    <div className="search-result-path">{getPath(page.id)}</div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
