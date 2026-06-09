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

// A page is the default document; folders and projects are colored containers
// that primarily exist to organize child pages in the sidebar tree.
export type PageKind = 'page' | 'folder' | 'project';

export interface Page {
  id: string;
  title: string;
  icon: string;
  cover: string;
  // 'page' when omitted (older persisted workspaces predate this field).
  kind?: PageKind;
  // Accent color (hex) for folders/projects. Falls back to the theme accent.
  color?: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  lastVisited: number;
  parentId?: string;
  children: string[];
  favorited: boolean;
  // When set, this page is shown as a calendar event spanning [eventStart, eventEnd]
  // (local-time day boundaries). Pages without these fall back to createdAt.
  eventStart?: number;
  eventEnd?: number;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
}

// A single goal on the progress tree. Each goal is rendered as a leaf that
// blooms once `done` flips to true; overall completion grows the whole tree.
export interface TreeGoal {
  id: string;
  text: string;
  done: boolean;
}

export interface AppState {
  pages: Record<string, Page>;
  rootPages: string[];
  activePage: string | null;
  view: 'home' | 'page' | 'calendar' | 'habits' | 'tree';
  recentPages: string[];
  // Habit tracker
  habits: Habit[];
  // Completion log, keyed by `${dayKey}__${habitId}` → true.
  habitLog: Record<string, boolean>;
  // Free-text note per day, keyed by dayKey.
  habitNotes: Record<string, string>;
  // Progress tree — goals shown as leaves that bloom when completed.
  treeGoals: TreeGoal[];
}
