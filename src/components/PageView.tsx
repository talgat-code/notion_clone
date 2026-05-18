import { useRef, useState } from 'react';
import { useStore } from '../store';
import { BlockEditor } from './BlockEditor';

const EMOJI_LIST = ['📄','📝','📌','🗒️','💡','🎯','📚','🔖','✨','🗂️','🏠','🌟','🔥','💎','🚀','🎨','📊','🧩','🌈','⚡'];

interface PageViewProps {
  pageId: string;
}

export function PageView({ pageId }: PageViewProps) {
  const { pages, updatePageTitle, updatePageIcon, createPage } = useStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const page = pages[pageId];

  if (!page) {
    return (
      <div className="empty-state">
        <div className="empty-state-content">
          <div className="empty-icon">📄</div>
          <h2>No page selected</h2>
          <p>Select a page from the sidebar or create a new one.</p>
          <button className="cta-btn" onClick={() => createPage()}>
            + New page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-view">
      <div className="page-cover" />
      <div className="page-content">
        <div className="page-icon-row">
          <button
            className="page-icon-btn"
            onClick={() => setShowEmojiPicker((v) => !v)}
            title="Change icon"
          >
            {page.icon}
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker">
              {EMOJI_LIST.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    updatePageIcon(pageId, e);
                    setShowEmojiPicker(false);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          ref={titleRef}
          className="page-title-input"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Untitled"
          onInput={(e) =>
            updatePageTitle(pageId, (e.currentTarget as HTMLDivElement).innerText)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const el = document.querySelector('.block-input') as HTMLElement;
              el?.focus();
            }
          }}
          dangerouslySetInnerHTML={{ __html: page.title }}
        />
        <div className="page-meta">
          {new Date(page.updatedAt).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </div>
        <BlockEditor pageId={pageId} />
      </div>
    </div>
  );
}
