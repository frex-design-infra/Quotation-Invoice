import React, { useState } from 'react';

interface Props {
  onLogin: () => void;
}

const CORRECT_PASSWORD = '1111';

export default function LoginScreen({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('auth', '1');
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #1a1040 75%, #0f0c29 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Hiragino Kaku Gothic ProN', 'Meiryo', 'Yu Gothic', sans-serif",
    }}>
      {/* カード */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '44px 48px 40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* 会社名 */}
        <p style={{
          color: '#714cb6',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textAlign: 'center',
          marginBottom: '10px',
        }}>
          FRe:x Design inc.
        </p>

        {/* タイトル */}
        <h1 style={{
          color: '#292827',
          fontSize: '20px',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '-0.3px',
          lineHeight: 1.3,
          marginBottom: '6px',
        }}>
          見積書 / 請求書管理システム
        </h1>

        {/* サブタイトル */}
        <p style={{
          color: '#888',
          fontSize: '12px',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          社内限定システム　ログインが必要です
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* パスワードラベル */}
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#444' }}>
            パスワード
          </label>

          {/* 入力フィールド */}
          <div style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="パスワードを入力"
              autoFocus
              style={{
                width: '100%',
                padding: '11px 14px',
                border: error ? '1.5px solid #f87171' : '1.5px solid #dcd7d3',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#292827',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = '#cbb7fb'; }}
              onBlur={e => { if (!error) e.target.style.borderColor = '#dcd7d3'; }}
            />
            {error && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>
                パスワードが正しくありません
              </p>
            )}
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#292827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginTop: '4px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3d3c3a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#292827')}
          >
            ログイン
          </button>
        </form>

        <p style={{
          color: '#bbb',
          fontSize: '11px',
          textAlign: 'center',
          marginTop: '20px',
        }}>
          ※ パスワードは管理者にお問い合わせください
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
