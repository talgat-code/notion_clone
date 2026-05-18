import type { Page } from '../types';
import { useStore } from '../store';

function getBreadcrumbs(pages: Record<string, Page>, pageId: string) {
  const crumbs: Array<{ id: string; title: string; icon: string }> = [];
  let current: Page | undefined = pages[pageId];
  while (current) {
    crumbs.unshift({ id: current.id, title: current.title || 'Untitled', icon: current.icon });
    current = current.parentId ? pages[current.parentId] : undefined;
  }
  return crumbs;
}

export function Header() {
  const { pages, activePage, view, visitPage, toggleFavorite } = useStore();

  if (view === 'home') {
    return (
      <header className="header">
        <div className="header-breadcrumbs">
          <span className="header-bc-item current">Home</span>
        </div>
        <div className="header-actions" />
      </header>
    );
  }

  if (!activePage || !pages[activePage]) return null;

  const page = pages[activePage];
  const crumbs = getBreadcrumbs(pages, activePage);

  const edited = new Date(page.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="header">
      <div className="header-breadcrumbs">
        {crumbs.map((crumb, i) => (
          <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span className="header-bc-sep">/</span>}
            <button
              className={`header-bc-item ${i === crumbs.length - 1 ? 'current' : ''}`}
              onClick={() => visitPage(crumb.id)}
            >
              <span>{crumb.icon}</span>
              <span>{crumb.title}</span>
            </button>
          </span>
        ))}
      </div>

      <div className="header-actions">
        <span className="header-edited">Edited {edited}</span>
        <button
          className={`header-btn ${page.favorited ? 'header-btn--active' : ''}`}
          onClick={() => toggleFavorite(activePage)}
          title={page.favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {page.favorited ? '⭐' : '☆'}
        </button>
        <button className="header-btn header-btn--primary">Share</button>
        <button className="header-btn">···</button>
      </div>
    </header>
  );
}
