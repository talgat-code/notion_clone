import { useRef, useEffect, useState, memo, type KeyboardEvent } from 'react';
import type { Block, BlockType } from '../types';
import { useStore, SNIPPETS } from '../store';

const TYPE_TRIGGERS: Record<string, BlockType> = {
  '# ':   'h1',
  '## ':  'h2',
  '### ': 'h3',
  '- ':   'bullet',
  '1. ':  'numbered',
  '[] ':  'todo',
  '> ':   'quote',
  '--- ': 'divider',
};

const PLACEHOLDER: Record<BlockType, string> = {
  text:     "Type '/' for commands…",
  h1:       'Heading 1',
  h2:       'Heading 2',
  h3:       'Heading 3',
  bullet:   'List item',
  numbered: 'List item',
  todo:     'To-do',
  quote:    'Quote',
  divider:  '',
  callout:  'Add a callout…',
  code:     'Write code…',
};

type MenuItem =
  | { kind: 'block'; key: string; type: BlockType; icon: string; label: string; desc: string; keywords?: string[] }
  | { kind: 'snippet'; key: string; icon: string; label: string; desc: string; keywords: string[] };

const BLOCK_ITEMS: MenuItem[] = [
  { kind: 'block', key: 'text',     type: 'text',     icon: '¶',  label: 'Text',          desc: 'Start with plain text' },
  { kind: 'block', key: 'h1',       type: 'h1',       icon: 'H1', label: 'Heading 1',     desc: 'Big section heading' },
  { kind: 'block', key: 'h2',       type: 'h2',       icon: 'H2', label: 'Heading 2',     desc: 'Medium section heading' },
  { kind: 'block', key: 'h3',       type: 'h3',       icon: 'H3', label: 'Heading 3',     desc: 'Small section heading' },
  { kind: 'block', key: 'bullet',   type: 'bullet',   icon: '•',  label: 'Bullet list',   desc: 'Unordered list' },
  { kind: 'block', key: 'numbered', type: 'numbered', icon: '1.', label: 'Numbered list', desc: 'Ordered list' },
  { kind: 'block', key: 'todo',     type: 'todo',     icon: '☐',  label: 'To-do',         desc: 'Trackable checkbox' },
  { kind: 'block', key: 'quote',    type: 'quote',    icon: '"',  label: 'Quote',         desc: 'Capture a quote' },
  { kind: 'block', key: 'callout',  type: 'callout',  icon: '💡', label: 'Callout',       desc: 'Highlighted callout box' },
  { kind: 'block', key: 'code',     type: 'code',     icon: '<>', label: 'Code',          desc: 'Code block' },
  { kind: 'block', key: 'divider',  type: 'divider',  icon: '—',  label: 'Divider',       desc: 'Visual separator' },
];

const SNIPPET_ITEMS: MenuItem[] = SNIPPETS.map((s) => ({
  kind: 'snippet',
  key: s.key,
  icon: s.icon,
  label: s.label,
  desc: s.desc,
  keywords: s.keywords,
}));

const MENU_ITEMS: MenuItem[] = [...BLOCK_ITEMS, ...SNIPPET_ITEMS];

interface BlockItemProps {
  block: Block;
  pageId: string;
  blockNumber: number;
  isFirst: boolean;
  focusBlock: (id: string) => void;
  focusPrevBlock: (id: string) => void;
}

const BlockItem = memo(function BlockItem({
  block,
  pageId,
  blockNumber,
  isFirst,
  focusBlock,
  focusPrevBlock,
}: BlockItemProps) {
  const { addBlock, updateBlock, deleteBlock, toggleTodo, changeBlockType, moveBlock, insertSnippet } = useStore();

  const inputRef = useRef<HTMLDivElement>(null);
  const prevTypeRef = useRef(block.type);
  const [showMenu, setShowMenu] = useState(false);
  const [menuFilter, setMenuFilter] = useState('');
  const [menuIdx, setMenuIdx] = useState(0);

  // Set content on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.innerText = block.content;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset DOM content when block type changes
  useEffect(() => {
    if (block.type !== prevTypeRef.current && inputRef.current) {
      inputRef.current.innerText = block.content;
      prevTypeRef.current = block.type;
      // Move cursor to end
      const el = inputRef.current;
      el.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [block.type, block.content]);

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const raw = e.currentTarget.innerText ?? '';
    const text = raw.replace(/\n/g, '');

    // Type trigger detection
    for (const [trigger, type] of Object.entries(TYPE_TRIGGERS)) {
      if (text === trigger) {
        changeBlockType(pageId, block.id, type);
        updateBlock(pageId, block.id, '');
        if (inputRef.current) inputRef.current.innerText = '';
        setShowMenu(false);
        return;
      }
    }

    // Slash menu
    const slashIdx = text.lastIndexOf('/');
    if (slashIdx >= 0) {
      setShowMenu(true);
      setMenuFilter(text.slice(slashIdx + 1).toLowerCase());
      setMenuIdx(0);
    } else {
      setShowMenu(false);
      setMenuFilter('');
    }

    updateBlock(pageId, block.id, text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const filtered = getFiltered();

    if (showMenu) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIdx((i) => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMenuIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); if (filtered[menuIdx]) selectItem(filtered[menuIdx]); return; }
      if (e.key === 'Escape')    { setShowMenu(false); return; }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newId = addBlock(pageId, block.id);
      setTimeout(() => focusBlock(newId), 20);
      return;
    }

    if (e.key === 'Backspace') {
      const text = inputRef.current?.innerText ?? '';
      if (text === '' && block.type !== 'text') {
        e.preventDefault();
        changeBlockType(pageId, block.id, 'text');
        updateBlock(pageId, block.id, '');
        return;
      }
      if (text === '' && !isFirst) {
        e.preventDefault();
        deleteBlock(pageId, block.id);
        focusPrevBlock(block.id);
        return;
      }
    }

    if (e.altKey && e.key === 'ArrowUp')   { e.preventDefault(); moveBlock(pageId, block.id, 'up'); }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); moveBlock(pageId, block.id, 'down'); }
  }

  function selectItem(item: MenuItem) {
    const cur = inputRef.current?.innerText ?? '';
    const slashIdx = cur.lastIndexOf('/');
    const newContent = slashIdx >= 0 ? cur.slice(0, slashIdx) : cur;

    if (item.kind === 'snippet') {
      // Clear the trigger text, then drop the snippet's blocks into the page.
      updateBlock(pageId, block.id, newContent);
      if (inputRef.current) inputRef.current.innerText = newContent;
      setShowMenu(false);
      setMenuFilter('');
      insertSnippet(pageId, block.id, item.key);
      return;
    }

    changeBlockType(pageId, block.id, item.type);
    updateBlock(pageId, block.id, newContent);
    if (inputRef.current) inputRef.current.innerText = newContent;
    setShowMenu(false);
    setMenuFilter('');
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  function getFiltered() {
    if (!menuFilter) return MENU_ITEMS;
    return MENU_ITEMS.filter(
      (m) =>
        m.label.toLowerCase().includes(menuFilter) ||
        m.key.includes(menuFilter) ||
        m.keywords?.some((k) => k.includes(menuFilter))
    );
  }

  const filtered = getFiltered();

  // ── Divider ──
  if (block.type === 'divider') {
    return <hr className="block-divider" />;
  }

  // ── Callout ──
  if (block.type === 'callout') {
    return (
      <div className="block-row" style={{ position: 'relative' }}>
        <div className="block-callout-wrap">
          <span className="callout-emoji">{block.calloutEmoji ?? '💡'}</span>
          <div
            ref={inputRef}
            className="block-input"
            contentEditable
            suppressContentEditableWarning
            data-placeholder={PLACEHOLDER.callout}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
          />
        </div>
        {showMenu && filtered.length > 0 && <SlashMenu items={filtered} selected={menuIdx} onSelect={selectItem} />}
      </div>
    );
  }

  // ── Code ──
  if (block.type === 'code') {
    return (
      <div className="block-row" style={{ position: 'relative' }}>
        <div className="block-code-wrap">
          <div className="code-lang-bar">Plain text</div>
          <div
            ref={inputRef}
            className="block-code-inner"
            contentEditable
            suppressContentEditableWarning
            data-placeholder={PLACEHOLDER.code}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
          />
        </div>
        {showMenu && filtered.length > 0 && <SlashMenu items={filtered} selected={menuIdx} onSelect={selectItem} />}
      </div>
    );
  }

  // ── Standard block ──
  return (
    <div className="block-row" style={{ position: 'relative' }}>
      {block.type === 'todo' && (
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={!!block.checked}
          onChange={() => toggleTodo(pageId, block.id)}
        />
      )}
      {block.type === 'numbered' && (
        <span className="numbered-badge">{blockNumber}.</span>
      )}
      <div
        ref={inputRef}
        className={`block-input block-${block.type} ${block.type === 'todo' && block.checked ? 'block-checked' : ''}`}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={PLACEHOLDER[block.type]}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
      {showMenu && filtered.length > 0 && <SlashMenu items={filtered} selected={menuIdx} onSelect={selectItem} />}
    </div>
  );
});

function SlashMenu({
  items,
  selected,
  onSelect,
}: {
  items: MenuItem[];
  selected: number;
  onSelect: (item: MenuItem) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const firstSnippet = items.findIndex((m) => m.kind === 'snippet');

  return (
    <div className="slash-menu" ref={listRef}>
      {items.map((item, i) => (
        <div key={item.kind + item.key}>
          {i === firstSnippet && <div className="slash-menu-section">Templates</div>}
          <button
            data-idx={i}
            className={`slash-menu-item ${i === selected ? 'slash-menu-item--selected' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
          >
            <span className={`slash-menu-icon ${item.kind === 'snippet' ? 'slash-menu-icon--snippet' : ''}`}>
              {item.icon}
            </span>
            <div>
              <div className="slash-menu-label">{item.label}</div>
              <div className="slash-menu-desc">{item.desc}</div>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}

export function BlockEditor({ pageId }: { pageId: string }) {
  const { pages } = useStore();
  const page = pages[pageId];
  const containerRef = useRef<HTMLDivElement>(null);
  if (!page) return null;

  function focusBlock(id: string) {
    setTimeout(() => {
      const el = containerRef.current?.querySelector(
        `[data-block-id="${id}"] .block-input, [data-block-id="${id}"] .block-code-inner`
      ) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }, 20);
  }

  function focusPrevBlock(currentId: string) {
    const idx = page.blocks.findIndex((b) => b.id === currentId);
    if (idx > 0) focusBlock(page.blocks[idx - 1].id);
  }

  // Compute numbered list indices
  const numbers: number[] = [];
  let count = 0;
  for (const b of page.blocks) {
    if (b.type === 'numbered') { count++; numbers.push(count); }
    else { count = 0; numbers.push(0); }
  }

  return (
    <div className="block-editor" ref={containerRef}>
      {page.blocks.map((block, i) => (
        <div key={block.id} data-block-id={block.id}>
          <BlockItem
            block={block}
            pageId={pageId}
            blockNumber={numbers[i]}
            isFirst={i === 0}
            focusBlock={focusBlock}
            focusPrevBlock={focusPrevBlock}
          />
        </div>
      ))}
    </div>
  );
}
