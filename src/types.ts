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

export interface AppState {
  pages: Record<string, Page>;
  rootPages: string[];
  activePage: string | null;
  view: 'home' | 'page' | 'calendar' | 'habits';
  recentPages: string[];
  // Habit tracker
  habits: Habit[];
  // Completion log, keyed by `${dayKey}__${habitId}` → true.
  habitLog: Record<string, boolean>;
  // Free-text note per day, keyed by dayKey.
  habitNotes: Record<string, string>;
}
