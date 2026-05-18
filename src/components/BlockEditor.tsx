import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useStore } from '../store';
import type { Block, BlockType } from '../types';

const TYPE_TRIGGERS: Record<string, BlockType> = {
  '# ': 'h1',
  '## ': 'h2',
  '### ': 'h3',
  '- ': 'bullet',
  '[] ': 'todo',
  '> ': 'quote',
  '--- ': 'divider',
};

const BLOCK_PLACEHOLDER: Record<BlockType, string> = {
  text: "Type '/' for commands…",
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bullet: 'List item',
  todo: 'To-do',
  quote: 'Quote',
  divider: '',
};

interface BlockProps {
  block: Block;
  pageId: string;
  isFirst: boolean;
  isLast?: boolean;
  onFocusNext: (id: string) => void;
  onFocusPrev: (id: string) => void;
}

function BlockItem({ block, pageId, isFirst, onFocusNext, onFocusPrev }: BlockProps) {
  const { updateBlock, addBlock, deleteBlock, toggleTodo, changeBlockType, moveBlock } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const ref = useRef<HTMLDivElement | HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current && block.content === '' && block.type !== 'divider') {
      // Only auto-focus newly added blocks
    }
  }, []);

  function handleInput(e: React.FormEvent<HTMLElement>) {
    const value = (e.currentTarget as HTMLElement).innerText ?? (e.currentTarget as HTMLInputElement).value;

    // Check type triggers
    for (const [trigger, type] of Object.entries(TYPE_TRIGGERS)) {
      if (value === trigger || value.startsWith(trigger)) {
        changeBlockType(pageId, block.id, type);
        updateBlock(pageId, block.id, value.slice(trigger.length));
        return;
      }
    }
    updateBlock(pageId, block.id, value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newId = addBlock(pageId, block.id);
      setTimeout(() => onFocusNext(newId), 10);
    }
    if (e.key === 'Backspace') {
      const val = block.content;
      if (val === '' && !isFirst) {
        e.preventDefault();
        deleteBlock(pageId, block.id);
        onFocusPrev(block.id);
      } else if (val === '' && block.type !== 'text') {
        e.preventDefault();
        changeBlockType(pageId, block.id, 'text');
      }
    }
    if (e.key === 'ArrowUp' && e.altKey) { moveBlock(pageId, block.id, 'up'); }
    if (e.key === 'ArrowDown' && e.altKey) { moveBlock(pageId, block.id, 'down'); }
    if (e.key === 'ArrowUp' && !e.altKey) { onFocusPrev(block.id); }
    if (e.key === 'ArrowDown' && !e.altKey) { onFocusNext(block.id); }
    if (e.key === '/') { setShowMenu(true); }
    if (e.key === 'Escape') { setShowMenu(false); }
  }

  function selectType(type: BlockType) {
    changeBlockType(pageId, block.id, type);
    updateBlock(pageId, block.id, '');
    setShowMenu(false);
    setTimeout(() => (ref.current as HTMLElement)?.focus(), 10);
  }

  if (block.type === 'divider') {
    return <hr className="block-divider" />;
  }

  const commonProps = {
    className: `block-input block-${block.type}`,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    'data-placeholder': BLOCK_PLACEHOLDER[block.type],
  };

  return (
    <div className="block-wrapper" style={{ position: 'relative' }}>
      {block.type === 'todo' && (
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={!!block.checked}
          onChange={() => toggleTodo(pageId, block.id)}
        />
      )}
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        {...commonProps}
        style={block.type === 'todo' && block.checked ? { textDecoration: 'line-through', opacity: 0.6 } : {}}
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
      {showMenu && (
        <div className="slash-menu">
          {(['text', 'h1', 'h2', 'h3', 'bullet', 'todo', 'quote', 'divider'] as BlockType[]).map((t) => (
            <button key={t} onMouseDown={() => selectType(t)}>
              {t === 'text' && '¶ Text'}
              {t === 'h1' && 'H1 Heading 1'}
              {t === 'h2' && 'H2 Heading 2'}
              {t === 'h3' && 'H3 Heading 3'}
              {t === 'bullet' && '• Bullet List'}
              {t === 'todo' && '☐ To-do'}
              {t === 'quote' && '" Quote'}
              {t === 'divider' && '— Divider'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface BlockEditorProps {
  pageId: string;
}

export function BlockEditor({ pageId }: BlockEditorProps) {
  const { pages } = useStore();
  const page = pages[pageId];
  const containerRef = useRef<HTMLDivElement>(null);

  if (!page) return null;

  function focusBlock(id: string) {
    const el = containerRef.current?.querySelector(`[data-block-id="${id}"] .block-input`) as HTMLElement;
    el?.focus();
  }

  function focusNext(currentId: string) {
    const blocks = page.blocks;
    const idx = blocks.findIndex((b) => b.id === currentId);
    if (idx < blocks.length - 1) focusBlock(blocks[idx + 1].id);
    else focusBlock(currentId);
  }

  function focusPrev(currentId: string) {
    const blocks = page.blocks;
    const idx = blocks.findIndex((b) => b.id === currentId);
    if (idx > 0) focusBlock(blocks[idx - 1].id);
  }

  return (
    <div className="block-editor" ref={containerRef}>
      {page.blocks.map((block, i) => (
        <div key={block.id} data-block-id={block.id}>
          <BlockItem
            block={block}
            pageId={pageId}
            isFirst={i === 0}
            isLast={i === page.blocks.length - 1}
            onFocusNext={focusNext}
            onFocusPrev={focusPrev}
          />
        </div>
      ))}
    </div>
  );
}
