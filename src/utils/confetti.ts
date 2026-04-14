/**
 * 軽量紙吹雪エフェクト（外部ライブラリ不要）
 * triggerConfetti(element) でボタン位置を基点に紙吹雪を発生させる
 */
const COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff6bcd', '#ff9f43', '#a29bfe', '#00cec9',
];

export function triggerConfetti(origin?: HTMLElement | { x: number; y: number }) {
  let cx: number;
  let cy: number;

  if (origin instanceof HTMLElement) {
    const rect = origin.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
  } else if (origin) {
    cx = origin.x;
    cy = origin.y;
  } else {
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 2;
  }

  const COUNT = 48;

  for (let i = 0; i < COUNT; i++) {
    const piece = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 130;
    const tx = Math.cos(angle) * speed;
    // 上方向バイアス：下半球を減らし、全体的に上に飛ばす
    const ty = Math.sin(angle) * speed * 0.6 - 80;
    const size = 7 + Math.random() * 9;
    const isCircle = Math.random() > 0.45;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const delay = Math.random() * 80; // ms

    piece.style.cssText = [
      'position:fixed',
      `left:${cx - size / 2}px`,
      `top:${cy - size / 2}px`,
      `width:${size}px`,
      `height:${size}px`,
      `background:${color}`,
      `border-radius:${isCircle ? '50%' : '3px'}`,
      'pointer-events:none',
      'z-index:9999',
      'opacity:1',
      'will-change:transform,opacity',
    ].join(';');

    document.body.appendChild(piece);

    // delay → 発射
    setTimeout(() => {
      piece.style.transition =
        `transform 1s cubic-bezier(0.15, 0.9, 0.35, 1) ${delay}ms,` +
        `opacity 1s ease-in ${delay + 200}ms`;
      piece.style.transform = `translate(${tx}px, ${ty + 220}px) rotate(${Math.random() * 720}deg)`;
      piece.style.opacity = '0';
    }, 10);

    setTimeout(() => piece.remove(), 1200 + delay);
  }
}
