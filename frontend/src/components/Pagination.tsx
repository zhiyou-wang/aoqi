import type { CSSProperties } from 'react';
import { LiquidButton } from './LiquidButton';

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

const navBtnStyle: CSSProperties = { padding: '10px 18px', fontSize: 14 };

/** 列表分页条：上一页 / 第 x / y 页 / 下一页；只有一页时不渲染 */
export function Pagination({ page, pages, onChange }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <LiquidButton disabled={page <= 1} onClick={() => onChange(page - 1)} style={navBtnStyle}>
        上一页
      </LiquidButton>
      <span>
        第 {page} / {pages} 页
      </span>
      <LiquidButton disabled={page >= pages} onClick={() => onChange(page + 1)} style={navBtnStyle}>
        下一页
      </LiquidButton>
    </div>
  );
}
