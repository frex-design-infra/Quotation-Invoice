import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Quotation, Invoice, MasterSettings } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { triggerConfetti } from '../utils/confetti';
import ReviewControl from '../components/ReviewControl';
import { listFlows, listMembers, listLatestRejects, type RejectInfo } from '../lib/approval';
import type { ApprovalFlow, Member } from '../types/approval';

interface Props {
  quotations: Quotation[];
  invoices: Invoice[];
  settings: MasterSettings;
  onNew: () => void;
  onEdit: (q: Quotation) => void;
  onPreview: (q: Quotation) => void;
  onDelete: (id: string) => void;
  onToggleSubmitted: (id: string) => void;
  onCreateInvoice: (q: Quotation, billingType: 'single' | 'interim' | 'final') => void;
  onOpenFukken: (q: Quotation, tab?: 'seisho' | 'delivery' | 'invoice') => void;
  onOpenFukuyama: (q: Quotation, billingType?: 'single' | 'interim' | 'final') => void;
  onOpenFukuyamaInterimQuotation: (q: Quotation) => void;
  onOpenInterimQuotation: (q: Quotation) => void;
  onOpenChangeQuotation: (q: Quotation, round: number) => void;
}

export default function QuotationList({ quotations, invoices, settings, onNew, onEdit, onPreview, onDelete, onToggleSubmitted, onCreateInvoice, onOpenFukken, onOpenFukuyama, onOpenFukuyamaInterimQuotation, onOpenInterimQuotation, onOpenChangeQuotation }: Props) {
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 承認フロー：全フローとメンバーを一括ロード
  const [flowMap, setFlowMap] = useState<Record<string, ApprovalFlow>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [rejects, setRejects] = useState<Record<string, RejectInfo>>({});
  const loadApproval = useCallback(async () => {
    try {
      const [flows, mems] = await Promise.all([listFlows(), listMembers()]);
      const map: Record<string, ApprovalFlow> = {};
      // 同一見積に複数フローがある場合は最新（listFlowsはcreated_at降順）を採用
      for (const f of flows) { if (!map[f.quotationId]) map[f.quotationId] = f; }
      setFlowMap(map);
      setMembers(mems);
      const rj = await listLatestRejects(flows.map(f => f.id));
      setRejects(rj);
    } catch (e) {
      console.error('承認フローの読み込みに失敗', e);
    }
  }, []);
  useEffect(() => { loadApproval(); }, [loadApproval]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getLatestChange = (q: Quotation) => {
    const changes = q.changeQuotations ?? [];
    if (changes.length === 0) return null;
    return [...changes].sort((a, b) => b.round - a.round)[0];
  };

  const getChangeAmountInfo = (q: Quotation) => {
    const latestChange = getLatestChange(q);
    if (!latestChange) return null;
    const changeTotal = calculateTotals(latestChange.items, settings).total;
    return { latestChange, changeTotal, diff: changeTotal - q.total };
  };

  const formatDiff = (diff: number) => {
    if (diff === 0) return '±¥0';
    return `${diff > 0 ? '+' : '▲'}¥${formatCurrency(Math.abs(diff))}`;
  };

  const handleToggle = (e: React.MouseEvent, id: string, currentlySubmitted: boolean) => {
    e.stopPropagation();
    if (!currentlySubmitted) {
      triggerConfetti(e.currentTarget as HTMLElement);
    }
    onToggleSubmitted(id);
    setAnimatingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setAnimatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  };

  return (
    <div className="quotation-list">
      <div className="list-header">
        <h2>見積書一覧</h2>
        <button onClick={onNew} className="btn-primary">＋ 新規見積書作成</button>
      </div>

      {quotations.length > 0 && (
        <div style={{ margin: '0 0 14px', color: '#555', fontSize: 14, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span>全 {quotations.length} 件</span>
          <span>合計金額 <b style={{ fontSize: 18, color: '#292827' }}>¥ {formatCurrency(quotations.reduce((s, q) => s + (q.total || 0), 0))}</b></span>
        </div>
      )}

      {quotations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <p>見積書がありません</p>
          <button onClick={onNew} className="btn-primary">最初の見積書を作成</button>
        </div>
      ) : (
        <table className="list-table">
          <thead>
            <tr>
              <th>見積番号</th>
              <th>見積日</th>
              <th>発注者名</th>
              <th>件名</th>
              <th>合計金額</th>
              <th>橋数/基数</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id} onClick={() => onEdit(q)} className="list-row">
                <td className="mono">{q.quotationNumber}</td>
                <td>{formatDate(q.date)}</td>
                <td>{q.clientName}</td>
                <td className="project-name-cell">{q.projectName}</td>
                <td className="amount-cell">
                  {(() => {
                    const changeInfo = getChangeAmountInfo(q);
                    if (!changeInfo) return <>¥ {formatCurrency(q.total)}</>;
                    return (
                      <div style={{ lineHeight: 1.35 }}>
                        <div style={{ fontWeight: 700 }}>¥ {formatCurrency(changeInfo.changeTotal)}</div>
                        <div style={{ fontSize: '11px', color: '#8a8178', whiteSpace: 'nowrap' }}>
                          変更後（第{changeInfo.latestChange.round}回）
                        </div>
                        <div style={{ fontSize: '11px', color: changeInfo.diff < 0 ? '#b45309' : '#6b7280', whiteSpace: 'nowrap' }}>
                          元 ¥{formatCurrency(q.total)} / {formatDiff(changeInfo.diff)}
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="center">
                  {q.inspectionType === '道路附属物点検'
                    ? q.roadAccessoryCount || 0
                    : q.bridges.length}
                </td>
                <td onClick={e => e.stopPropagation()} className="action-cell">
                  <ReviewControl quotation={q} settings={settings} flow={flowMap[q.id]} members={members} reject={flowMap[q.id] ? rejects[flowMap[q.id].id] : undefined} onChanged={loadApproval} />
                  <button
                    className={`status-btn ${q.submitted ? 'submitted' : 'not-submitted'} ${animatingIds.has(q.id) ? 'pikoon' : ''}`}
                    onClick={e => handleToggle(e, q.id, q.submitted)}
                  >
                    {q.submitted ? '提出済' : '未提出'}
                  </button>
                  <div className="action-menu-wrap" ref={openMenuId === q.id ? menuRef : undefined}>
                    <button
                      className="btn-outline btn-sm action-menu-btn"
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === q.id ? null : q.id); }}
                    >
                      操作 ▾
                    </button>
                    {openMenuId === q.id && (
                      <div className="action-dropdown">
                        <button onClick={() => { onPreview(q); setOpenMenuId(null); }}>
                          プレビュー
                        </button>
                        {/* 変更見積（元請会社問わず全見積・提出済が対象） */}
                        {q.submitted && (() => {
                          const changes = [...(q.changeQuotations ?? [])].sort((a, b) => a.round - b.round);
                          const nextRound = changes.length > 0 ? Math.max(...changes.map(c => c.round)) + 1 : 1;
                          return (
                            <>
                              <div className="dropdown-divider" />
                              {changes.map(c => (
                                <button key={c.round} onClick={() => { onOpenChangeQuotation(q, c.round); setOpenMenuId(null); }}>
                                  第{c.round}回変更見積を開く
                                </button>
                              ))}
                              <button onClick={() => { onOpenChangeQuotation(q, nextRound); setOpenMenuId(null); }}>
                                変更見積作成（第{nextRound}回）
                              </button>
                            </>
                          );
                        })()}
                        {(() => {
                          const isFukuyama = q.fukuyamaEnabled || q.clientName.includes('福山コンサルタント');
                          const isFukken = !isFukuyama && (q.fukkenEnabled || q.clientName.includes('復建技術コンサルタント'));
                          if (isFukuyama) {
                            const interimInvoice = invoices.find(
                              inv => inv.quotationId === q.id && inv.isFukuyama && inv.billingType === 'interim'
                            );
                            const interimInvoiceSubmitted = interimInvoice?.submitted ?? false;
                            return (
                              <>
                                {q.submitted && (
                                  <>
                                    <div className="dropdown-divider" />
                                    {!q.hasInterimBilling && (
                                      <button
                                        className="dropdown-fukken"
                                        onClick={() => { onOpenFukuyama(q, 'single'); setOpenMenuId(null); }}
                                      >
                                        納品書兼請求書作成
                                      </button>
                                    )}
                                    {q.hasInterimBilling && (() => {
                                      if (!q.fukuyamaInterimQuotationSubmitted) {
                                        return (
                                          <button
                                            className="dropdown-fukken"
                                            onClick={() => { onOpenFukuyamaInterimQuotation(q); setOpenMenuId(null); }}
                                          >
                                            中間見積書作成
                                          </button>
                                        );
                                      }
                                      if (!interimInvoiceSubmitted) {
                                        return (
                                          <>
                                            <button
                                              className="dropdown-fukken"
                                              onClick={() => { onOpenFukuyamaInterimQuotation(q); setOpenMenuId(null); }}
                                            >
                                              中間見積書を開く
                                            </button>
                                            <button
                                              className="dropdown-fukken"
                                              onClick={() => { onOpenFukuyama(q, 'interim'); setOpenMenuId(null); }}
                                            >
                                              中間請求書作成
                                            </button>
                                          </>
                                        );
                                      }
                                      return (
                                        <>
                                          <button
                                            className="dropdown-fukken"
                                            onClick={() => { onOpenFukuyama(q, 'interim'); setOpenMenuId(null); }}
                                          >
                                            中間請求書を開く
                                          </button>
                                          <button
                                            className="dropdown-fukken"
                                            onClick={() => { onOpenFukuyama(q, 'final'); setOpenMenuId(null); }}
                                          >
                                            納品書/請求書作成
                                          </button>
                                        </>
                                      );
                                    })()}
                                  </>
                                )}
                              </>
                            );
                          }
                          if (isFukken) {
                            return (
                              <>
                                {q.submitted && (
                                  <button
                                    className="dropdown-fukken"
                                    onClick={() => { onOpenFukken(q, 'seisho'); setOpenMenuId(null); }}
                                  >
                                    請書作成
                                  </button>
                                )}
                                <div className="dropdown-divider" />
                                {q.submitted && (
                                  <button
                                    className="dropdown-fukken"
                                    onClick={() => { onOpenFukken(q, 'delivery'); setOpenMenuId(null); }}
                                  >
                                    納品書/請求書作成
                                  </button>
                                )}
                              </>
                            );
                          }
                          return (
                            <>
                              {q.submitted && !q.hasInterimBilling && (
                                <button onClick={() => { onCreateInvoice(q, 'single'); setOpenMenuId(null); }}>
                                  請求書作成
                                </button>
                              )}
                              {q.submitted && q.hasInterimBilling && (() => {
                                const interimInvoice = invoices.find(
                                  inv => inv.quotationId === q.id && !inv.isFukuyama && !inv.isFukken && inv.billingType === 'interim'
                                );
                                const interimInvoiceSubmitted = interimInvoice?.submitted ?? false;
                                if (!q.interimQuotationSubmitted) {
                                  return (
                                    <button
                                      className="dropdown-fukken"
                                      onClick={() => { onOpenInterimQuotation(q); setOpenMenuId(null); }}
                                    >
                                      中間見積書作成
                                    </button>
                                  );
                                }
                                if (!interimInvoiceSubmitted) {
                                  return (
                                    <>
                                      <button
                                        className="dropdown-fukken"
                                        onClick={() => { onOpenInterimQuotation(q); setOpenMenuId(null); }}
                                      >
                                        中間見積書を開く
                                      </button>
                                      <button onClick={() => { onCreateInvoice(q, 'interim'); setOpenMenuId(null); }}>
                                        中間請求書作成
                                      </button>
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    <button onClick={() => { onCreateInvoice(q, 'interim'); setOpenMenuId(null); }}>
                                      中間請求書を開く
                                    </button>
                                    <button onClick={() => { onCreateInvoice(q, 'final'); setOpenMenuId(null); }}>
                                      最終請求書作成
                                    </button>
                                  </>
                                );
                              })()}
                            </>
                          );
                        })()}
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-danger"
                          onClick={() => {
                            if (confirm(`「${q.quotationNumber}」を削除しますか？`)) {
                              onDelete(q.id);
                            }
                            setOpenMenuId(null);
                          }}
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
