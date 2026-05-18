import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PageView } from './components/PageView';
import { useStore } from './store';
import './App.css';

export default function App() {
  const { activePage, rootPages, createPage } = useStore();

  useEffect(() => {
    if (rootPages.length === 0) {
      createPage();
    }
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <PageView pageId={activePage ?? ''} />
      </main>
    </div>
  );
}
