import { useState, useRef, useEffect } from 'react';
import { useStore, COVERS, PAGE_COLORS } from '../store';
import type { PageKind } from '../types';
import { BlockEditor } from './BlockEditor';

const EMOJIS = [
  '📄','📝','📌','🗒️','💡','🎯','📚','🔖','✨','🗂️',
  '🏠','🌟','🔥','💎','🚀','🎨','📊','🧩','🌈','⚡',
  '🎵','🎬','🌍','🏆','💻','🍀','🎭','📐','🔬','🏋️',
];

export function PageView({ pageId }: { pageId: string }) {
  const { pages, updatePageTitle, updatePageIcon, updatePageCover, updatePageColor, createPage, visitPage } = useStore();
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const page = pages[pageId];

  // Sync title DOM when page changes (avoid cursor jump on typing)
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.innerText = page?.title ?? '';
    }
    setShowEmoji(false);
    setShowCoverPicker(false);
    setShowColorPicker(false);
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
  const kind: PageKind = page.kind ?? 'page';
  const isContainer = kind !== 'page';
  const accent = page.color;
  const children = page.children.map((id) => pages[id]).filter(Boolean);

  return (
    <div
      className="page-view"
      style={accent ? ({ '--page-accent': accent } as React.CSSProperties) : undefined}
    >
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
        {/* Kind badge + color picker (folders & projects) */}
        {isContainer && (
          <div className="page-kind-bar">
            <span
              className="page-kind-badge"
              style={accent ? { background: `${accent}1f`, color: accent } : undefined}
            >
              {kind === 'folder' ? '📁 Folder' : '🚀 Project'}
            </span>
            <div className="page-color-wrap">
              <button
                className="page-color-btn"
                onClick={() => setShowColorPicker((v) => !v)}
                title="Change color"
              >
                <span className="page-color-dot" style={{ background: accent }} />
                Color
              </button>
              {showColorPicker && (
                <div className="page-color-picker" onMouseLeave={() => setShowColorPicker(false)}>
                  {PAGE_COLORS.map((c) => (
                    <button
                      key={c.key}
                      title={c.name}
                      className={`page-color-swatch ${accent === c.value ? 'is-active' : ''}`}
                      style={{ background: c.value }}
                      onClick={() => { updatePageColor(pageId, c.value); setShowColorPicker(false); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Sub-pages inside a folder / project */}
        {isContainer && (
          <section className="subpages">
            <div className="subpages-head">
              <span className="subpages-title">Inside this {kind}</span>
              <div className="subpages-add">
                <button onClick={() => visitPage(createPage(pageId, 'page'))}>+ Page</button>
                <button onClick={() => createPage(pageId, 'folder')}>+ Folder</button>
                <button onClick={() => createPage(pageId, 'project')}>+ Project</button>
              </div>
            </div>
            {children.length > 0 ? (
              <div className="subpages-grid">
                {children.map((child) => (
                  <button
                    key={child.id}
                    className="subpage-card"
                    style={child.color ? { '--card-accent': child.color } as React.CSSProperties : undefined}
                    onClick={() => visitPage(child.id)}
                  >
                    <span className="subpage-card-icon">{child.icon}</span>
                    <span className="subpage-card-title">{child.title || 'Untitled'}</span>
                    {child.kind && child.kind !== 'page' && (
                      <span className="subpage-card-kind">{child.kind}</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="subpages-empty">
                Nothing here yet — add a page, folder or project above.
              </div>
            )}
          </section>
        )}

        <BlockEditor pageId={pageId} />
      </div>
    </div>
  );
}
