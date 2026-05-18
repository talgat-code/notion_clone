import { useState, useRef, useEffect } from 'react';
import { useStore, COVERS } from '../store';
import { BlockEditor } from './BlockEditor';

const EMOJIS = [
  '📄','📝','📌','🗒️','💡','🎯','📚','🔖','✨','🗂️',
  '🏠','🌟','🔥','💎','🚀','🎨','📊','🧩','🌈','⚡',
  '🎵','🎬','🌍','🏆','💻','🍀','🎭','📐','🔬','🏋️',
];

export function PageView({ pageId }: { pageId: string }) {
  const { pages, updatePageTitle, updatePageIcon, updatePageCover } = useStore();
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const page = pages[pageId];

  // Sync title DOM when page changes (avoid cursor jump on typing)
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.innerText = page?.title ?? '';
    }
    setShowEmoji(false);
    setShowCoverPicker(false);
  }, [pageId]);

  if (!page) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'var(--text-muted)', fontSize: 16,
        }}
      >
        Select a page or create a new one.
      </div>
    );
  }

  const hasCover = Boolean(page.cover);

  return (
    <div className="page-view">
      {/* ── Cover ── */}
      <div className={`page-cover-wrap ${!hasCover ? 'page-cover-wrap--empty' : ''}`}>
        {hasCover && (
          <div className="page-cover-bg" style={{ background: page.cover }} />
        )}

        {hasCover && (
          <div className="cover-overlay">
            <button className="cover-overlay-btn" onClick={() => setShowCoverPicker((v) => !v)}>
              Change cover
            </button>
            <button className="cover-overlay-btn" onClick={() => updatePageCover(pageId, '')}>
              Remove
            </button>
          </div>
        )}

        {!hasCover && (
          <button
            className="add-cover-btn"
            onClick={() => updatePageCover(pageId, COVERS[Math.floor(Math.random() * COVERS.length)])}
          >
            + Add cover
          </button>
        )}

        {showCoverPicker && (
          <div className="cover-picker">
            {COVERS.map((g) => (
              <button
                key={g}
                className="cover-option"
                style={{ background: g }}
                onClick={() => { updatePageCover(pageId, g); setShowCoverPicker(false); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="page-content">
        {/* Icon */}
        <div className="page-icon-row">
          <button className="page-icon-btn" onClick={() => setShowEmoji((v) => !v)}>
            {page.icon}
          </button>
          {showEmoji && (
            <div className="emoji-picker">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { updatePageIcon(pageId, e); setShowEmoji(false); }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div
          ref={titleRef}
          className="page-title-input"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Untitled"
          onInput={(e) => updatePageTitle(pageId, (e.currentTarget as HTMLDivElement).innerText)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              document.querySelector<HTMLElement>('.block-input')?.focus();
            }
          }}
        />

        <div className="page-meta">
          {new Date(page.updatedAt).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </div>

        <BlockEditor pageId={pageId} />
      </div>
    </div>
  );
}
