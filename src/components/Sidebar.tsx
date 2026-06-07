import { useState } from 'react';
import { useStore } from '../store';
import { useCurrentUser } from '../auth';
import { ProfileModal } from './ProfileModal';
import type { PageKind } from '../types';

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

  const kind = page.kind ?? 'page';
  const isContainer = kind !== 'page';
  const isActive = activePage === pageId && view === 'page';
  const hasChildren = page.children.length > 0;
  const accent = page.color;

  // Folders behave like pure containers — clicking toggles their contents.
  const handleOpen = () => {
    if (kind === 'folder') setExpanded((v) => !v);
    else visitPage(pageId);
  };

  return (
    <div className="tree-item-wrapper">
      <div
        className={`tree-item ${isActive ? 'tree-item--active' : ''}`}
        style={{
          paddingLeft: `${8 + depth * 14}px`,
          ...(accent ? ({ '--row-accent': accent } as React.CSSProperties) : {}),
        }}
      >
        <button
          className="tree-expand"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        >
          {hasChildren || isContainer ? (expanded ? '▾' : '▸') : ''}
        </button>
        <button className="tree-main" onClick={handleOpen}>
          <span className={`tree-icon ${isContainer ? 'tree-icon--chip' : ''}`}
            style={isContainer && accent ? { background: `${accent}22`, boxShadow: `inset 0 0 0 1px ${accent}40` } : undefined}
          >
            {page.icon}
          </span>
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
          <button
            title="Add inside"
            onClick={(e) => { e.stopPropagation(); createPage(pageId); setExpanded(true); }}
          >
            +
          </button>
        </div>
        {showMenu && (
          <div className="tree-menu" onMouseLeave={() => setShowMenu(false)}>
            <button onClick={() => { createPage(pageId, 'page'); setExpanded(true); setShowMenu(false); }}>
              📄 Add page
            </button>
            <button onClick={() => { createPage(pageId, 'folder'); setExpanded(true); setShowMenu(false); }}>
              📁 Add folder
            </button>
            <button onClick={() => { createPage(pageId, 'project'); setExpanded(true); setShowMenu(false); }}>
              🚀 Add project
            </button>
            <div className="tree-menu-sep" />
            <button onClick={() => { duplicatePage(pageId); setShowMenu(false); }}>
              ⎘ Duplicate
            </button>
            <button className="danger" onClick={() => { deletePage(pageId); setShowMenu(false); }}>
              🗑 Delete
            </button>
          </div>
        )}
      </div>
      {expanded && page.children.map((childId) => (
        <PageTreeItem key={childId} pageId={childId} depth={depth + 1} />
      ))}
      {expanded && isContainer && !hasChildren && (
        <div className="tree-empty" style={{ paddingLeft: `${8 + (depth + 1) * 14 + 22}px` }}>
          Empty — use + to add
        </div>
      )}
    </div>
  );
}

const NEW_OPTIONS: Array<{ kind: PageKind; icon: string; label: string }> = [
  { kind: 'page', icon: '📄', label: 'Page' },
  { kind: 'folder', icon: '📁', label: 'Folder' },
  { kind: 'project', icon: '🚀', label: 'Project' },
];

interface SidebarProps {
  onSearch: () => void;
}

export function Sidebar({ onSearch }: SidebarProps) {
  const { pages, rootPages, view, activePage, createPage, goHome, goCalendar, goHabits, visitPage } = useStore();
  const user = useCurrentUser();
  const [showProfile, setShowProfile] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);

  const favorites = Object.values(pages).filter((p) => p.favorited);
  const initial = (user?.name.trim()[0] || '?').toUpperCase();

  return (
    <aside className="sidebar">
      {/* Workspace header — opens profile */}
      <button
        className="sidebar-workspace"
        onClick={() => setShowProfile(true)}
        title="Account & profile"
      >
        <div className="workspace-avatar" style={user ? { background: user.color } : undefined}>
          {user?.avatar || initial}
        </div>
        <span className="workspace-name">{user?.name || 'My Workspace'}</span>
        <span className="workspace-action">⌄</span>
      </button>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

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
        <button
          className={`nav-item ${view === 'calendar' ? 'nav-item--active' : ''}`}
          onClick={goCalendar}
        >
          <span className="nav-icon">📅</span>
          Calendar
        </button>
        <button
          className={`nav-item ${view === 'habits' ? 'nav-item--active' : ''}`}
          onClick={goHabits}
        >
          <span className="nav-icon">✅</span>
          Habits
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
          <div className="sidebar-section-label">Workspace</div>
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

      {/* New page / folder / project */}
      <div className="sidebar-new-wrap">
        {showNewMenu && (
          <div className="sidebar-new-menu" onMouseLeave={() => setShowNewMenu(false)}>
            {NEW_OPTIONS.map((opt) => (
              <button
                key={opt.kind}
                onClick={() => { createPage(undefined, opt.kind); setShowNewMenu(false); }}
              >
                <span className="sidebar-new-menu-icon">{opt.icon}</span>
                New {opt.label}
              </button>
            ))}
          </div>
        )}
        <div className="sidebar-new-page">
          <button className="sidebar-new-main" onClick={() => createPage()}>
            <span>+</span> New page
          </button>
          <button
            className="sidebar-new-caret"
            title="Create folder or project"
            onClick={() => setShowNewMenu((v) => !v)}
          >
            ⌄
          </button>
        </div>
      </div>
    </aside>
  );
}
