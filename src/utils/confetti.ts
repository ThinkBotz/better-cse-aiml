/**
 * Neo-Brutalist Geometric Confetti Burst
 * Lightweight pure canvas implementation with zero external dependencies.
 * Spawns punchy geometric shapes (squares, rectangles, pills) in brand bold colors.
 */

const CONFETTI_COLORS = [
  '#FFE600', // Electric Yellow
  '#2563EB', // Electric Blue
  '#00D26A', // Neon Green
  '#FF5722', // Electric Coral
  '#7C3AED', // Electric Purple
  '#FF2A85', // Punchy Pink
  '#00B4D8'  // Vivid Cyan
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export function fireConfetti(durationMs: number = 2500) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const w = (canvas.width = window.innerWidth * dpr);
  const h = (canvas.height = window.innerHeight * dpr);
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const particleCount = 65;
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.45;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    const size = 8 + Math.random() * 8;
    particles.push({
      x: originX + (Math.random() - 0.5) * 60,
      y: originY + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5, // initial upward kick
      size,
      width: size * (0.8 + Math.random() * 0.8),
      height: size * (0.6 + Math.random() * 0.6),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      opacity: 1
    });
  }

  const startTime = performance.now();
  let animationFrameId: number;

  function render(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);

    ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.985; // friction
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - progress);

      if (ctx) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        // Neo-Brutalist solid fill + hard 1.5px ink outline
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

        ctx.restore();
      }
    }

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
