import React, { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;        // YYYY-MM-DD
  onChange: (v: string) => void;
}

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-based
  const containerRef = useRef<HTMLDivElement>(null);

  // 開くとき現在の value に合わせてビューを同期
  const handleOpen = () => {
    if (value) {
      setViewYear(parseInt(value.slice(0, 4)));
      setViewMonth(parseInt(value.slice(5, 7)) - 1);
    }
    setOpen(o => !o);
  };

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  // カレンダーグリッド構築
  const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // 選択日・今日の判定
  const selParts = value ? value.split('-').map(Number) : null;
  const today = new Date();

  const formatDisplay = (v: string) => {
    if (!v) return '日付を選択';
    const [y, m, d] = v.split('-');
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
  };

  return (
    <div ref={containerRef} className="datepicker-wrap">
      <div className="datepicker-input" onClick={handleOpen}>
        <span>{formatDisplay(value)}</span>
        <span className="datepicker-icon">▼</span>
      </div>

      {open && (
        <div className="datepicker-popup">
          <div className="datepicker-header">
            <button className="datepicker-nav" onClick={prevMonth}>‹</button>
            <span className="datepicker-title">{viewYear}年 {viewMonth + 1}月</span>
            <button className="datepicker-nav" onClick={nextMonth}>›</button>
          </div>

          <div className="datepicker-grid">
            {DOW.map(d => (
              <div key={d} className={`datepicker-dow${d === '日' ? ' dow-sun' : d === '土' ? ' dow-sat' : ''}`}>{d}</div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const col = i % 7; // 0=Sun, 6=Sat
              const isSelected = selParts &&
                selParts[0] === viewYear &&
                selParts[1] === viewMonth + 1 &&
                selParts[2] === day;
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day;
              return (
                <div
                  key={i}
                  className={[
                    'datepicker-day',
                    isSelected ? 'selected' : '',
                    isToday && !isSelected ? 'today' : '',
                    col === 0 ? 'sun' : col === 6 ? 'sat' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
