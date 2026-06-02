import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { PageView } from './components/PageView';
import { Calendar } from './components/Calendar';
import { SearchModal } from './components/SearchModal';
import { useStore } from './store';
import './App.css';

export default function App() {
  const { activePage, rootPages, view, createPage } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // Create welcome page on first launch
  useEffect(() => {
    if (rootPages.length === 0) createPage();
  }, []);

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
