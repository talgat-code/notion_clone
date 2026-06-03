import { useStore, TEMPLATES } from '../store';
import { useCurrentUser } from '../auth';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage() {
  const { pages, recentPages, visitPage, createFromTemplate } = useStore();
  const user = useCurrentUser();
  const firstName = user?.name.trim().split(/\s+/)[0];

  const recents = recentPages
    .filter((id) => pages[id])
    .slice(0, 8)
    .map((id) => pages[id]);

  const allPages = Object.values(pages).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="home-page">
      <div className="home-greeting">{greeting()}{firstName ? `, ${firstName}` : ''}</div>

      {/* Templates / quick start */}
      <section className="home-section">
        <h2 className="home-section-title">
          <span>✨</span> Start with a template
        </h2>
        <div className="template-grid">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.key}
              className="template-card"
              onClick={() => createFromTemplate(tpl)}
            >
              <div
                className="template-card-icon"
                style={tpl.cover ? { background: tpl.cover } : undefined}
              >
                {tpl.icon}
              </div>
              <div className="template-card-text">
                <div className="template-card-label">{tpl.label}</div>
                <div className="template-card-desc">{tpl.description}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recently visited */}
      {recents.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">
            <span>🕐</span> Recently visited
          </h2>
          <div className="home-grid">
            {recents.map((page) => (
              <button
                key={page.id}
                className="home-card"
                onClick={() => visitPage(page.id)}
              >
                <div
                  className={`home-card-cover ${!page.cover ? 'home-card-cover--default' : ''}`}
                  style={page.cover ? { background: page.cover } : undefined}
                />
                <div className="home-card-body">
                  <div className="home-card-icon">{page.icon}</div>
                  <div className="home-card-title">{page.title || 'Untitled'}</div>
                  <div className="home-card-date">
                    {new Date(page.lastVisited ?? page.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* All pages */}
      {allPages.length > 0 ? (
        <section className="home-section">
          <h2 className="home-section-title">
            <span>📁</span> All pages
            <span className="home-section-count">{allPages.length}</span>
          </h2>
          <div className="page-list">
            {allPages.map((page) => (
              <button
                key={page.id}
                className="page-list-card"
                onClick={() => visitPage(page.id)}
              >
                <span className="page-list-icon">{page.icon}</span>
                <span className="page-list-title">{page.title || 'Untitled'}</span>
                {page.favorited && <span className="page-list-fav">⭐</span>}
                <span className="page-list-date">
                  {new Date(page.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="home-empty">
          <div className="home-empty-icon">📄</div>
          <p>No pages yet — pick a template above to begin.</p>
        </div>
      )}
    </div>
  );
}
