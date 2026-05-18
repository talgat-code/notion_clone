import { useStore } from '../store';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage() {
  const { pages, recentPages, visitPage, createPage } = useStore();

  const recents = recentPages
    .filter((id) => pages[id])
    .slice(0, 8)
    .map((id) => pages[id]);

  return (
    <div className="home-page">
      <div className="home-greeting">{greeting()}</div>

      {recents.length > 0 ? (
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
      ) : (
        <div className="home-empty">
          <div className="home-empty-icon">📄</div>
          <p>No pages yet — create your first one.</p>
          <button className="home-new-btn" onClick={() => createPage()}>
            + New page
          </button>
        </div>
      )}
    </div>
  );
}
