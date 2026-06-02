import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Block, BlockType, Page } from './types';

export const COVERS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
];

const EMOJIS = ['📄','📝','📌','🗒️','💡','🎯','📚','🔖','✨','🗂️','🏠','🌟','🔥','💎','🚀'];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export interface PageTemplate {
  key: string;
  label: string;
  description: string;
  icon: string;
  cover: string;
  title: string;
  blocks: Array<Omit<Block, 'id'>>;
}

export const TEMPLATES: PageTemplate[] = [
  {
    key: 'blank',
    label: 'Blank page',
    description: 'Start from scratch',
    icon: '📄',
    cover: '',
    title: '',
    blocks: [{ type: 'text', content: '' }],
  },
  {
    key: 'todo',
    label: 'To-do list',
    description: 'Track your tasks',
    icon: '✅',
    cover: COVERS[3],
    title: 'To-do list',
    blocks: [
      { type: 'h2', content: 'Today' },
      { type: 'todo', content: 'First task', checked: false },
      { type: 'todo', content: 'Second task', checked: false },
      { type: 'todo', content: 'Third task', checked: false },
      { type: 'h2', content: 'Later' },
      { type: 'todo', content: '', checked: false },
    ],
  },
  {
    key: 'meeting',
    label: 'Meeting notes',
    description: 'Agenda & action items',
    icon: '📅',
    cover: COVERS[2],
    title: 'Meeting notes',
    blocks: [
      { type: 'callout', content: 'Date · Attendees · Goal', calloutEmoji: '📌' },
      { type: 'h2', content: 'Agenda' },
      { type: 'bullet', content: '' },
      { type: 'h2', content: 'Notes' },
      { type: 'text', content: '' },
      { type: 'h2', content: 'Action items' },
      { type: 'todo', content: '', checked: false },
    ],
  },
  {
    key: 'project',
    label: 'Project plan',
    description: 'Goals, scope & milestones',
    icon: '🎯',
    cover: COVERS[0],
    title: 'Project plan',
    blocks: [
      { type: 'callout', content: 'A short summary of what this project is about.', calloutEmoji: '💡' },
      { type: 'h2', content: 'Goals' },
      { type: 'bullet', content: '' },
      { type: 'h2', content: 'Milestones' },
      { type: 'todo', content: 'Kickoff', checked: false },
      { type: 'todo', content: 'MVP', checked: false },
      { type: 'todo', content: 'Launch', checked: false },
      { type: 'h2', content: 'Notes' },
      { type: 'text', content: '' },
    ],
  },
  {
    key: 'journal',
    label: 'Daily journal',
    description: 'Reflect on your day',
    icon: '📔',
    cover: COVERS[5],
    title: 'Daily journal',
    blocks: [
      { type: 'h2', content: 'How I feel today' },
      { type: 'text', content: '' },
      { type: 'h2', content: 'Three things I’m grateful for' },
      { type: 'numbered', content: '' },
      { type: 'h2', content: 'Highlights' },
      { type: 'bullet', content: '' },
    ],
  },
  {
    key: 'reading',
    label: 'Reading list',
    description: 'Books & articles to read',
    icon: '📚',
    cover: COVERS[9],
    title: 'Reading list',
    blocks: [
      { type: 'h2', content: 'Up next' },
      { type: 'todo', content: '', checked: false },
      { type: 'h2', content: 'Finished' },
      { type: 'todo', content: '', checked: true },
    ],
  },
];

function newPage(title = 'Untitled', parentId?: string): Page {
  return {
    id: uid(),
    title,
    icon: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    cover: '',
    blocks: [{ id: uid(), type: 'text', content: '' }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastVisited: Date.now(),
    parentId,
    children: [],
    favorited: false,
  };
}

interface Store extends AppState {
  createPage: (parentId?: string) => string;
  createFromTemplate: (tpl: PageTemplate) => string;
  deletePage: (id: string) => void;
  visitPage: (id: string) => void;
  goHome: () => void;
  goCalendar: () => void;
  updatePageTitle: (id: string, title: string) => void;
  updatePageIcon: (id: string, icon: string) => void;
  updatePageCover: (id: string, cover: string) => void;
  toggleFavorite: (id: string) => void;
  duplicatePage: (id: string) => string;
  addBlock: (pageId: string, afterId: string, type?: BlockType) => string;
  updateBlock: (pageId: string, blockId: string, content: string) => void;
  toggleTodo: (pageId: string, blockId: string) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  changeBlockType: (pageId: string, blockId: string, type: BlockType) => void;
  moveBlock: (pageId: string, blockId: string, direction: 'up' | 'down') => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      pages: {},
      rootPages: [],
      activePage: null,
      view: 'home' as const,
      recentPages: [],

      createPage(parentId) {
        const page = newPage('Untitled', parentId);
        set((s) => {
          const pages = { ...s.pages, [page.id]: page };
          const recentPages = [page.id, ...s.recentPages.filter((id) => id !== page.id)].slice(0, 10);
          if (parentId && pages[parentId]) {
            pages[parentId] = {
              ...pages[parentId],
              children: [...pages[parentId].children, page.id],
            };
            return { pages, activePage: page.id, view: 'page', recentPages };
          }
          return {
            pages,
            rootPages: [...s.rootPages, page.id],
            activePage: page.id,
            view: 'page',
            recentPages,
          };
        });
        return page.id;
      },

      createFromTemplate(tpl) {
        const page: Page = {
          ...newPage(tpl.title),
          icon: tpl.icon,
          cover: tpl.cover,
          blocks: tpl.blocks.map((b) => ({ ...b, id: uid() })),
        };
        set((s) => {
          const recentPages = [page.id, ...s.recentPages.filter((id) => id !== page.id)].slice(0, 10);
          return {
            pages: { ...s.pages, [page.id]: page },
            rootPages: [...s.rootPages, page.id],
            activePage: page.id,
            view: 'page',
            recentPages,
          };
        });
        return page.id;
      },

      deletePage(id) {
        set((s) => {
          const pages = { ...s.pages };
          const page = pages[id];
          if (!page) return s;

          if (page.parentId && pages[page.parentId]) {
            pages[page.parentId] = {
              ...pages[page.parentId],
              children: pages[page.parentId].children.filter((c) => c !== id),
            };
          }
          const rootPages = s.rootPages.filter((r) => r !== id);
          const recentPages = s.recentPages.filter((r) => r !== id);

          const toDelete = [id];
          while (toDelete.length) {
            const cur = toDelete.pop()!;
            const p = pages[cur];
            if (p?.children) toDelete.push(...p.children);
            delete pages[cur];
          }

          const activePage =
            s.activePage === id
              ? rootPages.find((r) => pages[r]) ?? Object.keys(pages)[0] ?? null
              : s.activePage;
          const view = activePage ? 'page' : 'home';

          return { pages, rootPages, activePage, view, recentPages };
        });
      },

      visitPage(id) {
        set((s) => {
          const page = s.pages[id];
          if (!page) return s;
          const recentPages = [id, ...s.recentPages.filter((r) => r !== id)].slice(0, 10);
          return {
            activePage: id,
            view: 'page',
            recentPages,
            pages: { ...s.pages, [id]: { ...page, lastVisited: Date.now() } },
          };
        });
      },

      goHome() {
        set({ view: 'home' });
      },

      goCalendar() {
        set({ view: 'calendar' });
      },

      updatePageTitle(id, title) {
        set((s) => ({
          pages: { ...s.pages, [id]: { ...s.pages[id], title, updatedAt: Date.now() } },
        }));
      },

      updatePageIcon(id, icon) {
        set((s) => ({
          pages: { ...s.pages, [id]: { ...s.pages[id], icon, updatedAt: Date.now() } },
        }));
      },

      updatePageCover(id, cover) {
        set((s) => ({
          pages: { ...s.pages, [id]: { ...s.pages[id], cover, updatedAt: Date.now() } },
        }));
      },

      toggleFavorite(id) {
        set((s) => ({
          pages: {
            ...s.pages,
            [id]: { ...s.pages[id], favorited: !s.pages[id]?.favorited },
          },
        }));
      },

      duplicatePage(id) {
        const page = get().pages[id];
        if (!page) return id;
        const dup: Page = {
          ...page,
          id: uid(),
          title: page.title + ' (copy)',
          blocks: page.blocks.map((b) => ({ ...b, id: uid() })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastVisited: Date.now(),
          children: [],
          favorited: false,
        };
        set((s) => {
          const pages = { ...s.pages, [dup.id]: dup };
          if (page.parentId && pages[page.parentId]) {
            pages[page.parentId] = {
              ...pages[page.parentId],
              children: [...pages[page.parentId].children, dup.id],
            };
            return { pages, activePage: dup.id, view: 'page' };
          }
          const idx = s.rootPages.indexOf(id);
          const rootPages = [...s.rootPages];
          rootPages.splice(idx + 1, 0, dup.id);
          return { pages, rootPages, activePage: dup.id, view: 'page' };
        });
        return dup.id;
      },

      addBlock(pageId, afterId, type = 'text') {
        const newBlock: Block = {
          id: uid(),
          type,
          content: '',
          ...(type === 'callout' ? { calloutEmoji: '💡' } : {}),
        };
        set((s) => {
          const page = s.pages[pageId];
          if (!page) return s;
          const idx = page.blocks.findIndex((b) => b.id === afterId);
          const blocks = [...page.blocks];
          blocks.splice(idx + 1, 0, newBlock);
          return {
            pages: { ...s.pages, [pageId]: { ...page, blocks, updatedAt: Date.now() } },
          };
        });
        return newBlock.id;
      },

      updateBlock(pageId, blockId, content) {
        set((s) => {
          const page = s.pages[pageId];
          if (!page) return s;
          return {
            pages: {
              ...s.pages,
              [pageId]: {
                ...page,
                updatedAt: Date.now(),
                blocks: page.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
              },
            },
          };
        });
      },

      toggleTodo(pageId, blockId) {
        set((s) => {
          const page = s.pages[pageId];
          if (!page) return s;
          return {
            pages: {
              ...s.pages,
              [pageId]: {
                ...page,
                blocks: page.blocks.map((b) => (b.id === blockId ? { ...b, checked: !b.checked } : b)),
              },
            },
          };
        });
      },

      deleteBlock(pageId, blockId) {
        set((s) => {
          const page = s.pages[pageId];
          if (!page || page.blocks.length <= 1) return s;
          return {
            pages: {
              ...s.pages,
              [pageId]: {
                ...page,
                updatedAt: Date.now(),
                blocks: page.blocks.filter((b) => b.id !== blockId),
              },
            },
          };
        });
      },

      changeBlockType(pageId, blockId, type) {
        set((s) => {
          const page = s.pages[pageId];
          if (!page) return s;
          return {
            pages: {
              ...s.pages,
              [pageId]: {
                ...page,
                blocks: page.blocks.map((b) =>
                  b.id === blockId
                    ? { ...b, type, checked: false, ...(type === 'callout' ? { calloutEmoji: b.calloutEmoji ?? '💡' } : {}) }
                    : b
                ),
              },
            },
          };
        });
      },

      moveBlock(pageId, blockId, direction) {
        set((s) => {
          const page = s.pages[pageId];
          if (!page) return s;
          const blocks = [...page.blocks];
          const idx = blocks.findIndex((b) => b.id === blockId);
          if (idx < 0) return s;
          const newIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= blocks.length) return s;
          [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
          return { pages: { ...s.pages, [pageId]: { ...page, blocks } } };
        });
      },
    }),
    { name: 'notion-clone-v2' }
  )
);
