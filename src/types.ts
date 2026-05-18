export type BlockType =
  | 'text' | 'h1' | 'h2' | 'h3'
  | 'todo' | 'bullet' | 'numbered'
  | 'quote' | 'divider' | 'callout' | 'code';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  calloutEmoji?: string;
}

export interface Page {
  id: string;
  title: string;
  icon: string;
  cover: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  lastVisited: number;
  parentId?: string;
  children: string[];
  favorited: boolean;
}

export interface AppState {
  pages: Record<string, Page>;
  rootPages: string[];
  activePage: string | null;
  view: 'home' | 'page';
  recentPages: string[];
}
