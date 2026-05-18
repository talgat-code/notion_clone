import { useRef, useEffect, useState, memo, type KeyboardEvent } from 'react';
import type { Block, BlockType } from '../types';
import { useStore } from '../store';

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

const MENU_ITEMS = [
  { type: 'text'    as BlockType, icon: '¶',  label: 'Text',          desc: 'Start with plain text' },
  { type: 'h1'      as BlockType, icon: 'H1', label: 'Heading 1',     desc: 'Big section heading' },
  { type: 'h2'      as BlockType, icon: 'H2', label: 'Heading 2',     desc: 'Medium section heading' },
  { type: 'h3'      as BlockType, icon: 'H3', label: 'Heading 3',     desc: 'Small section heading' },
  { type: 'bullet'  as BlockType, icon: '•',  label: 'Bullet list',   desc: 'Unordered list' },
  { type: 'numbered'as BlockType, icon: '1.', label: 'Numbered list', desc: 'Ordered list' },
  { type: 'todo'    as BlockType, icon: '☐',  label: 'To-do',         desc: 'Trackable checkbox' },
  { type: 'quote'   as BlockType, icon: '"',  label: 'Quote',         desc: 'Capture a quote' },
  { type: 'callout' as BlockType, icon: '💡', label: 'Callout',       desc: 'Highlighted callout box' },
  { type: 'code'    as BlockType, icon: '<>', label: 'Code',           desc: 'Code block' },
  { type: 'divider' as BlockType, icon: '—',  label: 'Divider',       desc: 'Visual separator' },
];

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
  const { addBlock, updateBlock, deleteBlock, toggleTodo, changeBlockType, moveBlock } = useStore();

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
      if (e.key === 'Enter')     { e.preventDefault(); if (filtered[menuIdx]) selectType(filtered[menuIdx].type); return; }
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

  function selectType(type: BlockType) {
    const cur = inputRef.current?.innerText ?? '';
    const slashIdx = cur.lastIndexOf('/');
    const newContent = slashIdx >= 0 ? cur.slice(0, slashIdx) : cur;
    changeBlockType(pageId, block.id, type);
    updateBlock(pageId, block.id, newContent);
    if (inputRef.current) inputRef.current.innerText = newContent;
    setShowMenu(false);
    setMenuFilter('');
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  function getFiltered() {
    if (!menuFilter) return MENU_ITEMS;
    return MENU_ITEMS.filter(
      (m) => m.label.toLowerCase().includes(menuFilter) || m.type.includes(menuFilter)
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
        {showMenu && filtered.length > 0 && <SlashMenu items={filtered} selected={menuIdx} onSelect={selectType} />}
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
        {showMenu && filtered.length > 0 && <SlashMenu items={filtered} selected={menuIdx} onSelect={selectType} />}
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
      {showMenu && filtered.length > 0 && <SlashMenu items={filtered} selected={menuIdx} onSelect={selectType} />}
    </div>
  );
});

function SlashMenu({
  items,
  selected,
  onSelect,
}: {
  items: typeof MENU_ITEMS;
  selected: number;
  onSelect: (type: BlockType) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <div className="slash-menu" ref={listRef}>
      {items.map((item, i) => (
        <button
          key={item.type}
          className={`slash-menu-item ${i === selected ? 'slash-menu-item--selected' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(item.type); }}
        >
          <span className="slash-menu-icon">{item.icon}</span>
          <div>
            <div className="slash-menu-label">{item.label}</div>
            <div className="slash-menu-desc">{item.desc}</div>
          </div>
        </button>
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
