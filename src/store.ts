import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Block, BlockType, Page } from './types';

const EMOJIS = ['📄', '📝', '📌', '🗒️', '💡', '🎯', '📚', '🔖', '✨', '🗂️'];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function newPage(title = 'Untitled', parentId?: string): Page {
  return {
    id: uid(),
    title,
    icon: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    blocks: [{ id: uid(), type: 'text', content: '' }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    parentId,
    children: [],
  };
}

interface Store extends AppState {
  createPage: (parentId?: string) => string;
  deletePage: (id: string) => void;
  setActivePage: (id: string) => void;
  updatePageTitle: (id: string, title: string) => void;
  updatePageIcon: (id: string, icon: string) => void;
  addBlock: (pageId: string, afterId: string, type?: BlockType) => string;
  updateBlock: (pageId: string, blockId: string, content: string) => void;
  toggleTodo: (pageId: string, blockId: string) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  changeBlockType: (pageId: string, blockId: string, type: BlockType) => void;
  moveBlock: (pageId: string, blockId: string, direction: 'up' | 'down') => void;
}

export const useStore = create<Store>()(
  persist(
    (set, _get) => ({
      pages: {},
      rootPages: [],
      activePage: null,

      createPage(parentId) {
        const page = newPage('Untitled', parentId);
        set((s) => {
          const pages = { ...s.pages, [page.id]: page };
          if (parentId && pages[parentId]) {
            pages[parentId] = {
              ...pages[parentId],
              children: [...pages[parentId].children, page.id],
            };
            return { pages, activePage: page.id };
          }
          return { pages, rootPages: [...s.rootPages, page.id], activePage: page.id };
        });
        return page.id;
      },

      deletePage(id) {
        set((s) => {
          const pages = { ...s.pages };
          const page = pages[id];
          if (!page) return s;

          // Remove from parent or root
          if (page.parentId && pages[page.parentId]) {
            pages[page.parentId] = {
              ...pages[page.parentId],
              children: pages[page.parentId].children.filter((c) => c !== id),
            };
          }
          const rootPages = s.rootPages.filter((r) => r !== id);

          // Delete page and all descendants
          const toDelete = [id];
          while (toDelete.length) {
            const current = toDelete.pop()!;
            const p = pages[current];
            if (p?.children) toDelete.push(...p.children);
            delete pages[current];
          }

          const activePage =
            s.activePage === id
              ? rootPages[0] ?? Object.keys(pages)[0] ?? null
              : s.activePage;

          return { pages, rootPages, activePage };
        });
      },

      setActivePage(id) {
        set({ activePage: id });
      },

      updatePageTitle(id, title) {
        set((s) => ({
          pages: {
            ...s.pages,
            [id]: { ...s.pages[id], title, updatedAt: Date.now() },
          },
        }));
      },

      updatePageIcon(id, icon) {
        set((s) => ({
          pages: {
            ...s.pages,
            [id]: { ...s.pages[id], icon, updatedAt: Date.now() },
          },
        }));
      },

      addBlock(pageId, afterId, type = 'text') {
        const newBlock: Block = { id: uid(), type, content: '' };
        set((s) => {
          const page = s.pages[pageId];
          if (!page) return s;
          const idx = page.blocks.findIndex((b) => b.id === afterId);
          const blocks = [...page.blocks];
          blocks.splice(idx + 1, 0, newBlock);
          return {
            pages: {
              ...s.pages,
              [pageId]: { ...page, blocks, updatedAt: Date.now() },
            },
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
                blocks: page.blocks.map((b) =>
                  b.id === blockId ? { ...b, content } : b
                ),
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
                blocks: page.blocks.map((b) =>
                  b.id === blockId ? { ...b, checked: !b.checked } : b
                ),
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
                  b.id === blockId ? { ...b, type, checked: false } : b
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
          return {
            pages: { ...s.pages, [pageId]: { ...page, blocks } },
          };
        });
      },
    }),
    { name: 'notion-clone-storage' }
  )
);
