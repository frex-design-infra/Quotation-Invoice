import React from 'react';
import type { Quotation, Invoice, MasterSettings } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';

interface Props {
  quotation: Quotation;
  invoices: Invoice[];
  settings: MasterSettings;
  onBack: () => void;
  onEditQuotation: (q: Quotation) => void;
  onPreviewQuotation: (q: Quotation) => void;
  onOpenChangeQuotation: (q: Quotation, round: number) => void;
  onOpenInterimQuotation: (q: Quotation) => void;
  onOpenFukuyamaInterimQuotation: (q: Quotation) => void;
  onCreateInvoice: (q: Quotation, billingType: 'single' | 'interim' | 'final') => void;
  onEditInvoice: (inv: Invoice) => void;
  onOpenFukken: (q: Quotation, tab?: 'seisho' | 'delivery' | 'invoice') => void;
  onOpenFukuyama: (q: Quotation, billingType?: 'single' | 'interim' | 'final') => void;
}

type Status = 'submitted' | 'pending' | 'not-created';

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; color: string; bg: string }> = {
    submitted:     { label: '提出済', color: '#166534', bg: '#dcfce7' },
    pending:       { label: '未提出', color: '#92400e', bg: '#fef3c7' },
    'not-created': { label: '未作成', color: '#6b7280', bg: '#f3f4f6' },
  };
  const s = map[status];
  return (
    <span style={{
      fontSize: 12,
      padding: '2px 8px',
      borderRadius: 9999,
      fontWeight: 600,
      color: s.color,
      background: s.bg,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

interface DocRowProps {
  label: string;
  number?: string;
  date?: string;
  status: Status;
  dimmed?: boolean;
  actions?: React.ReactNode;
}

function DocRow({ label, number, date, status, dimmed, actions }: DocRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      borderBottom: '1px solid #f0ede9',
      opacity: dimmed ? 0.42 : 1,
      gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#292827' }}>{label}</div>
        {(number || date) && (
          <div style={{ fontSize: 12, color: '#8a8178', marginTop: 2 }}>
            {number && <span className="mono" style={{ marginRight: 10 }}>{number}</span>}
            {date && <span>{date}</span>}
          </div>
        )}
      </div>
      <StatusBadge status={status} />
      {actions && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '6px 16px',
      background: '#f7f4f0',
      borderBottom: '1px solid #e8e0d6',
      borderTop: '1px solid #e8e0d6',
      fontSize: 11,
      fontWeight: 700,
      color: '#8a8178',
      letterSpacing: '0.06em',
    }}>
      {label}
    </div>
  );
}

export default function ProjectDetailPage({
  quotation: q, invoices, settings, onBack,
  onEditQuotation, onPreviewQuotation, onOpenChangeQuotation,
  onOpenInterimQuotation, onOpenFukuyamaInterimQuotation,
  onCreateInvoice, onEditInvoice, onOpenFukken, onOpenFukuyama,
}: Props) {
  const isFukuyama = !!(q.fukuyamaEnabled || q.clientName.includes('福山コンサルタント'));
  const isFukken = !isFukuyama && !!(q.fukkenEnabled || q.clientName.includes('復建技術コンサルタント'));

  /** 請求書を条件で1件取得 */
  const getInv = (
    fuFilter?: boolean,
    fkFilter?: boolean,
    bt?: 'single' | 'interim' | 'final',
  ): Invoice | undefined =>
    invoices.find(inv =>
      inv.quotationId === q.id &&
      (fuFilter === undefined || !!inv.isFukuyama === fuFilter) &&
      (fkFilter === undefined || !!inv.isFukken === fkFilter) &&
      (bt === undefined || inv.billingType === bt),
    );

  const formatDate = (d?: string) => {
    if (!d) return undefined;
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`;
  };

  const btn: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: 12,
    borderRadius: 5,
    border: '1px solid #d4c5b0',
    background: '#fff',
    cursor: 'pointer',
    color: '#292827',
    fontWeight: 500,
  };

  const changes = [...(q.changeQuotations ?? [])].sort((a, b) => a.round - b.round);
  const nextChangeRound = changes.length > 0 ? Math.max(...changes.map(c => c.round)) + 1 : 1;

  const latestChange = changes.length > 0 ? changes[changes.length - 1] : null;
  const displayTotal = latestChange
    ? calculateTotals(latestChange.items, settings).total
    : q.total;

  return (
    <div style={{ maxWidth: 680, margin: '24px auto', padding: '0 16px 40px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...btn, background: '#f7f4f0', padding: '6px 14px', fontSize: 13 }}>
          ← 一覧へ
        </button>
        <h2 style={{ flex: 1, fontSize: 18, fontWeight: 700, margin: 0, color: '#292827' }}>書類一覧</h2>
      </div>

      {/* 業務サマリカード */}
      <div style={{
        background: '#fff',
        border: '1px solid #e8e0d6',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 13, color: '#8a8178', marginBottom: 4 }}>{q.clientName}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#292827', marginBottom: 10 }}>{q.projectName}</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#5a5047', alignItems: 'center' }}>
          <span>見積番号: <span className="mono">{q.quotationNumber}</span></span>
          <span>見積日: {formatDate(q.date)}</span>
          <span>合計: <b>¥{formatCurrency(displayTotal)}</b></span>
          <span style={{
            padding: '2px 9px',
            borderRadius: 9999,
            background: q.submitted ? '#dcfce7' : '#fef3c7',
            color: q.submitted ? '#166534' : '#92400e',
            fontWeight: 600,
            fontSize: 12,
          }}>
            {q.submitted ? '提出済' : '未提出'}
          </span>
        </div>
      </div>

      {/* 書類カード */}
      <div style={{
        background: '#fff',
        border: '1px solid #e8e0d6',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>

        {/* ===== 見積書 ===== */}
        <SectionLabel label="見積書" />
        <DocRow
          label="見積書"
          number={q.quotationNumber}
          date={formatDate(q.date)}
          status={q.submitted ? 'submitted' : 'pending'}
          actions={
            <>
              <button style={btn} onClick={() => onPreviewQuotation(q)}>プレビュー</button>
              <button style={btn} onClick={() => onEditQuotation(q)}>編集</button>
            </>
          }
        />

        {/* 変更見積 */}
        {changes.map(c => (
          <DocRow
            key={c.round}
            label={`変更見積書（第${c.round}回）`}
            date={formatDate(c.issueDate)}
            status={c.submitted ? 'submitted' : 'pending'}
            actions={
              <button style={btn} onClick={() => onOpenChangeQuotation(q, c.round)}>開く</button>
            }
          />
        ))}

        {/* 変更見積追加ボタン（提出済のみ） */}
        {q.submitted && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0ede9' }}>
            <button
              style={{ ...btn, color: '#7c6d5e', fontSize: 12 }}
              onClick={() => onOpenChangeQuotation(q, nextChangeRound)}
            >
              ＋ 変更見積作成（第{nextChangeRound}回）
            </button>
          </div>
        )}

        {/* ===== 福山コンサルタント ===== */}
        {isFukuyama && (() => {
          const interimInv = getInv(true, undefined, 'interim');
          const finalInv = getInv(true, undefined, 'final');
          const singleInv = getInv(true, undefined, 'single');
          const interimQuotSubmitted = !!q.fukuyamaInterimQuotationSubmitted;
          const interimInvSubmitted = interimInv?.submitted ?? false;

          return (
            <>
              <SectionLabel label="福山コンサルタント 再委託書類" />
              {!q.submitted ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: '#8a8178' }}>
                  ※ 見積書を提出済にすると書類が作成できます
                </div>
              ) : !q.hasInterimBilling ? (
                <DocRow
                  label="納品書兼請求書"
                  number={singleInv?.invoiceNumber}
                  date={formatDate(singleInv?.issueDate)}
                  status={singleInv ? (singleInv.submitted ? 'submitted' : 'pending') : 'not-created'}
                  actions={
                    singleInv
                      ? <button style={btn} onClick={() => onEditInvoice(singleInv)}>開く</button>
                      : <button style={btn} onClick={() => onOpenFukuyama(q, 'single')}>作成</button>
                  }
                />
              ) : (
                <>
                  <DocRow
                    label="中間見積書"
                    date={formatDate(q.fukuyamaInterimQuotationIssueDate)}
                    status={interimQuotSubmitted ? 'submitted' : 'not-created'}
                    actions={
                      <button style={btn} onClick={() => onOpenFukuyamaInterimQuotation(q)}>
                        {interimQuotSubmitted ? '開く' : '作成'}
                      </button>
                    }
                  />
                  <DocRow
                    label="中間請求書"
                    number={interimInv?.invoiceNumber}
                    date={formatDate(interimInv?.issueDate)}
                    status={interimInv ? (interimInv.submitted ? 'submitted' : 'pending') : 'not-created'}
                    dimmed={!interimQuotSubmitted}
                    actions={
                      interimQuotSubmitted
                        ? (interimInv
                            ? <button style={btn} onClick={() => onEditInvoice(interimInv)}>開く</button>
                            : <button style={btn} onClick={() => onOpenFukuyama(q, 'interim')}>作成</button>
                          )
                        : undefined
                    }
                  />
                  <DocRow
                    label="納品書/請求書（最終）"
                    number={finalInv?.invoiceNumber}
                    date={formatDate(finalInv?.issueDate)}
                    status={finalInv ? (finalInv.submitted ? 'submitted' : 'pending') : 'not-created'}
                    dimmed={!interimInvSubmitted}
                    actions={
                      interimInvSubmitted
                        ? (finalInv
                            ? <button style={btn} onClick={() => onEditInvoice(finalInv)}>開く</button>
                            : <button style={btn} onClick={() => onOpenFukuyama(q, 'final')}>作成</button>
                          )
                        : undefined
                    }
                  />
                </>
              )}
            </>
          );
        })()}

        {/* ===== 復建技術コンサルタント ===== */}
        {isFukken && (() => {
          const fkInv = getInv(undefined, true);
          return (
            <>
              <SectionLabel label="復建技術コンサルタント 書類" />
              {!q.submitted ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: '#8a8178' }}>
                  ※ 見積書を提出済にすると書類が作成できます
                </div>
              ) : (
                <>
                  <DocRow
                    label="請書"
                    date={formatDate(q.fukkenSeishoDate)}
                    status={q.fukkenSeishoSubmitted ? 'submitted' : 'not-created'}
                    actions={
                      <button style={btn} onClick={() => onOpenFukken(q, 'seisho')}>
                        {q.fukkenSeishoSubmitted ? '開く' : '作成'}
                      </button>
                    }
                  />
                  <DocRow
                    label="納品書/請求書"
                    number={fkInv?.invoiceNumber}
                    date={formatDate(fkInv?.issueDate)}
                    status={fkInv ? (fkInv.submitted ? 'submitted' : 'pending') : 'not-created'}
                    dimmed={!q.fukkenSeishoSubmitted}
                    actions={
                      q.fukkenSeishoSubmitted
                        ? <button style={btn} onClick={() => onOpenFukken(q, 'delivery')}>
                            {fkInv ? '開く' : '作成'}
                          </button>
                        : undefined
                    }
                  />
                </>
              )}
            </>
          );
        })()}

        {/* ===== 通常（元請） ===== */}
        {!isFukuyama && !isFukken && (() => {
          const singleInv = getInv(false, false, 'single');
          const interimInv = getInv(false, false, 'interim');
          const finalInv = getInv(false, false, 'final');
          const interimQuotSubmitted = !!q.interimQuotationSubmitted;
          const interimInvSubmitted = interimInv?.submitted ?? false;

          return (
            <>
              <SectionLabel label="請求書類" />
              {!q.submitted ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: '#8a8178' }}>
                  ※ 見積書を提出済にすると請求書が作成できます
                </div>
              ) : !q.hasInterimBilling ? (
                <DocRow
                  label="請求書"
                  number={singleInv?.invoiceNumber}
                  date={formatDate(singleInv?.issueDate)}
                  status={singleInv ? (singleInv.submitted ? 'submitted' : 'pending') : 'not-created'}
                  actions={
                    singleInv
                      ? <button style={btn} onClick={() => onEditInvoice(singleInv)}>開く</button>
                      : <button style={btn} onClick={() => onCreateInvoice(q, 'single')}>作成</button>
                  }
                />
              ) : (
                <>
                  <DocRow
                    label="中間見積書"
                    date={formatDate(q.interimQuotationIssueDate)}
                    status={interimQuotSubmitted ? 'submitted' : 'not-created'}
                    actions={
                      <button style={btn} onClick={() => onOpenInterimQuotation(q)}>
                        {interimQuotSubmitted ? '開く' : '作成'}
                      </button>
                    }
                  />
                  <DocRow
                    label="中間請求書"
                    number={interimInv?.invoiceNumber}
                    date={formatDate(interimInv?.issueDate)}
                    status={interimInv ? (interimInv.submitted ? 'submitted' : 'pending') : 'not-created'}
                    dimmed={!interimQuotSubmitted}
                    actions={
                      interimQuotSubmitted
                        ? (interimInv
                            ? <button style={btn} onClick={() => onEditInvoice(interimInv)}>開く</button>
                            : <button style={btn} onClick={() => onCreateInvoice(q, 'interim')}>作成</button>
                          )
                        : undefined
                    }
                  />
                  <DocRow
                    label="最終請求書"
                    number={finalInv?.invoiceNumber}
                    date={formatDate(finalInv?.issueDate)}
                    status={finalInv ? (finalInv.submitted ? 'submitted' : 'pending') : 'not-created'}
                    dimmed={!interimInvSubmitted}
                    actions={
                      interimInvSubmitted
                        ? (finalInv
                            ? <button style={btn} onClick={() => onEditInvoice(finalInv)}>開く</button>
                            : <button style={btn} onClick={() => onCreateInvoice(q, 'final')}>作成</button>
                          )
                        : undefined
                    }
                  />
                </>
              )}
            </>
          );
        })()}

      </div>
    </div>
  );
}
