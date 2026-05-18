import { useState } from 'react';
import { useStore } from '../store';

interface PageTreeItemProps {
  pageId: string;
  depth?: number;
}

function PageTreeItem({ pageId, depth = 0 }: PageTreeItemProps) {
  const { pages, activePage, view, visitPage, createPage, deletePage, duplicatePage } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const page = pages[pageId];
  if (!page) return null;

  const isActive = activePage === pageId && view === 'page';
  const hasChildren = page.children.length > 0;

  return (
    <div className="tree-item-wrapper">
      <div
        className={`tree-item ${isActive ? 'tree-item--active' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <button
          className="tree-expand"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        >
          {hasChildren ? (expanded ? '▾' : '▸') : ''}
        </button>
        <button className="tree-main" onClick={() => visitPage(pageId)}>
          <span className="tree-icon">{page.icon}</span>
          <span className="tree-title">{page.title || 'Untitled'}</span>
          {page.favorited && <span className="tree-fav">⭐</span>}
        </button>
        <div className="tree-actions">
          <button
            title="More"
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          >
            ···
          </button>
          <button title="Add sub-page" onClick={(e) => { e.stopPropagation(); createPage(pageId); }}>
            +
          </button>
        </div>
        {showMenu && (
          <div className="tree-menu" onMouseLeave={() => setShowMenu(false)}>
            <button onClick={() => { createPage(pageId); setShowMenu(false); }}>
              + Add sub-page
            </button>
            <button onClick={() => { duplicatePage(pageId); setShowMenu(false); }}>
              ⎘ Duplicate
            </button>
            <button className="danger" onClick={() => { deletePage(pageId); setShowMenu(false); }}>
              🗑 Delete
            </button>
          </div>
        )}
      </div>
      {expanded && hasChildren && page.children.map((childId) => (
        <PageTreeItem key={childId} pageId={childId} depth={depth + 1} />
      ))}
    </div>
  );
}

interface SidebarProps {
  onSearch: () => void;
}

export function Sidebar({ onSearch }: SidebarProps) {
  const { pages, rootPages, view, activePage, createPage, goHome, visitPage } = useStore();

  const favorites = Object.values(pages).filter((p) => p.favorited);

  return (
    <aside className="sidebar">
      {/* Workspace header */}
      <div className="sidebar-workspace">
        <div className="workspace-avatar">N</div>
        <span className="workspace-name">My Workspace</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <button className="nav-item" onClick={onSearch}>
          <span className="nav-icon">🔍</span>
          Search
          <span className="nav-shortcut">⌘K</span>
        </button>
        <button
          className={`nav-item ${view === 'home' ? 'nav-item--active' : ''}`}
          onClick={goHome}
        >
          <span className="nav-icon">🏠</span>
          Home
        </button>
        <button className="nav-item">
          <span className="nav-icon">📥</span>
          Inbox
        </button>
      </nav>

      <div className="sidebar-divider" />

      {/* Scrollable sections */}
      <div className="sidebar-sections">
        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Favorites</div>
            {favorites.map((p) => (
              <button
                key={p.id}
                className={`sidebar-fav-link ${activePage === p.id && view === 'page' ? 'active' : ''}`}
                onClick={() => visitPage(p.id)}
              >
                <span>{p.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title || 'Untitled'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Pages */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Pages</div>
          {rootPages.map((id) => (
            <PageTreeItem key={id} pageId={id} />
          ))}
          {rootPages.length === 0 && (
            <div style={{ padding: '4px 8px', fontSize: 13, color: 'var(--text-faint)' }}>
              No pages yet
            </div>
          )}
        </div>
      </div>

      <button className="sidebar-new-page" onClick={() => createPage()}>
        <span>+</span> New page
      </button>
    </aside>
  );
}
