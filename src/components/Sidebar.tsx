import { useState } from 'react';
import { useStore } from '../store';

interface PageItemProps {
  pageId: string;
  depth?: number;
}

function PageItem({ pageId, depth = 0 }: PageItemProps) {
  const { pages, activePage, setActivePage, createPage, deletePage } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const page = pages[pageId];
  if (!page) return null;

  const isActive = activePage === pageId;

  return (
    <div>
      <div
        className={`page-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setActivePage(pageId)}
      >
        <button
          className="expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {page.children.length > 0 ? (expanded ? '▾' : '▸') : ' '}
        </button>
        <span className="page-icon">{page.icon}</span>
        <span className="page-title">{page.title || 'Untitled'}</span>
        {hovered && (
          <div className="page-actions" onClick={(e) => e.stopPropagation()}>
            <button
              title="Add sub-page"
              onClick={() => createPage(pageId)}
            >
              +
            </button>
            <button
              title="Delete page"
              onClick={() => deletePage(pageId)}
            >
              ×
            </button>
          </div>
        )}
      </div>
      {expanded && page.children.map((childId) => (
        <PageItem key={childId} pageId={childId} depth={depth + 1} />
      ))}
    </div>
  );
}

export function Sidebar() {
  const { rootPages, createPage } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="workspace-name">
          <span>🧠</span> My Workspace
        </div>
      </div>
      <div className="sidebar-section-label">Pages</div>
      <div className="pages-list">
        {rootPages.map((id) => (
          <PageItem key={id} pageId={id} />
        ))}
      </div>
      <button className="new-page-btn" onClick={() => createPage()}>
        + New page
      </button>
    </aside>
  );
}
