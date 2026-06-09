import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { PageView } from './components/PageView';
import { Calendar } from './components/Calendar';
import { Habits } from './components/Habits';
import { ProgressTree } from './components/ProgressTree';
import { SearchModal } from './components/SearchModal';
import { AuthScreen } from './components/AuthScreen';
import { useStore } from './store';
import { useCurrentUser } from './auth';
import './App.css';

export default function App() {
  const { activePage, rootPages, view, createPage } = useStore();
  const currentUser = useCurrentUser();
  const [searchOpen, setSearchOpen] = useState(false);

  // Create welcome page on first launch (once signed in)
  useEffect(() => {
    if (currentUser && rootPages.length === 0) createPage();
  }, [currentUser]);

  // Global ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="app">
      <Sidebar onSearch={() => setSearchOpen(true)} />

      <div className="content-area">
        <Header />
        <div className="content-scroll">
          {view === 'home' ? (
            <HomePage />
          ) : view === 'calendar' ? (
            <Calendar />
          ) : view === 'habits' ? (
            <Habits />
          ) : view === 'tree' ? (
            <ProgressTree />
          ) : activePage ? (
            <PageView pageId={activePage} />
          ) : (
            <HomePage />
          )}
        </div>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
