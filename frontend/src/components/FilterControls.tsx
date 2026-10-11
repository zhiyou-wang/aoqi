/**
 * 筛选栏控件。
 * FilterSelect —— Apple HIG「下拉式按钮」：玻璃胶囊 + 向下箭头，点击弹出
 * 液态玻璃菜单，选中后菜单关闭并 onChange；外部点击 / Esc 关闭。
 * FilterSearch —— 玻璃搜索框。
 */
import { useEffect, useRef, useState } from 'react';

export interface FilterOption {
  code: string | number;
  name: string;
}

interface FilterSelectProps {
  value: string;
  options?: FilterOption[] | null;
  /** 空值项（“全部…”）的文案 */
  allLabel: string;
  onChange: (value: string) => void;
}

function CheckMark() {
  return (
    <svg className="pd__check" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilterSelect({ value, options, allLabel, onChange }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options?.find((o) => String(o.code) === value);
  const label = selected ? selected.name : allLabel;

  // 打开时：点击组件外部 / Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className={`pd${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="pd__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="pd__label">{label}</span>
        <svg className="pd__chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="pd__menu" role="menu">
        <button
          type="button"
          role="menuitem"
          className={`pd__item${value === '' ? ' is-selected' : ''}`}
          onClick={() => choose('')}
        >
          <span>{allLabel}</span>
          <CheckMark />
        </button>
        {options?.map((o) => {
          const v = String(o.code);
          return (
            <button
              type="button"
              role="menuitem"
              key={v}
              className={`pd__item${v === value ? ' is-selected' : ''}`}
              onClick={() => choose(v)}
            >
              <span>{o.name}</span>
              <CheckMark />
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FilterSearchProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export function FilterSearch({ value, placeholder, onChange }: FilterSearchProps) {
  return (
    <input
      className="filter-bar__search"
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
