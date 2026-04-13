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
      background: 'linear-gradient(160deg, #1b1938 0%, #2d2354 50%, #1b1938 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Hiragino Kaku Gothic ProN', 'Meiryo', 'Yu Gothic', sans-serif",
    }}>
      {/* ロゴ・タイトル */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <h1 style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: '26px',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          見積書 / 請求書管理システム
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '14px',
          letterSpacing: '0.3px',
        }}>
          FRe:x Design inc.
        </p>
      </div>

      {/* カード */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '16px',
        padding: '40px 48px',
        width: '100%',
        maxWidth: '380px',
        backdropFilter: 'blur(8px)',
      }}>
        <h2 style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          ようこそ
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '13px',
          textAlign: 'center',
          marginBottom: '28px',
        }}>
          パスワードを入力してください
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            animation: shake ? 'shake 0.4s ease' : 'none',
          }}>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="パスワード"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: error ? '1.5px solid #f87171' : '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '18px',
                letterSpacing: '6px',
                textAlign: 'center',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                if (!error) e.target.style.borderColor = 'rgba(203,183,251,0.6)';
              }}
              onBlur={e => {
                if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            />
            {error && (
              <p style={{
                color: '#f87171',
                fontSize: '12px',
                textAlign: 'center',
                marginTop: '8px',
              }}>
                パスワードが正しくありません
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#e9e5dd',
              color: '#292827',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d9d4cc')}
            onMouseLeave={e => (e.currentTarget.style.background = '#e9e5dd')}
          >
            ログイン
          </button>
        </form>
      </div>

      {/* ラベンダーアクセント */}
      <div style={{
        marginTop: '40px',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
      }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbb7fb', opacity: 0.6 }} />
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbb7fb', opacity: 0.9 }} />
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbb7fb', opacity: 0.6 }} />
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
