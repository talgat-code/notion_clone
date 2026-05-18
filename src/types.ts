export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'quote' | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

export interface Page {
  id: string;
  title: string;
  icon: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  parentId?: string;
  children: string[];
}

export interface AppState {
  pages: Record<string, Page>;
  rootPages: string[];
  activePage: string | null;
}
