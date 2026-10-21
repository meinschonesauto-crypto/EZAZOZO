import React, { useEffect, useRef, useState } from 'react';
import { Wordmark } from './Wordmark';

export const Preloader: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => setVisible(false), 350);
  };

  useEffect(() => {
    // Si l'utilisateur préfère moins d'animation, on ferme quasi-instantanément
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = setTimeout(dismiss, 150);
      return () => clearTimeout(t);
    }

    // Minuteur max 1.2s pour ne jamais bloquer la navigation
    const maxTimer = setTimeout(dismiss, 1200);

    // Particules de braise légères sur canvas (20 particules max)
    const canvas = canvasRef.current;
    if (!canvas) return () => clearTimeout(maxTimer);

    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearTimeout(maxTimer);

    let rafId = 0;
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 12 : 24;

    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;
    }

    const colors = ['#FF4500', '#FF6B35', '#D4AF37', '#FFA07A'];
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * 50,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(Math.random() * 1.5 + 0.8),
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.7 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.004;
        if (p.y < 0 || p.alpha <= 0) {
          p.x = Math.random() * w;
          p.y = h + 10;
          p.alpha = Math.random() * 0.7 + 0.3;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      clearTimeout(maxTimer);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Chargement d'EZAZOZO"
      onClick={dismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D0D] cursor-pointer transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      />
      <div className="absolute inset-0 pointer-events-none grain" />

      <div className="relative z-10 flex flex-col items-center text-center p-6 select-none animate-fadeIn">
        <Wordmark size="lg" showSubtitle={true} />
        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#FF4500] to-transparent my-4" />
        <p className="text-[10px] uppercase font-brand tracking-[0.28em] text-[#D4AF37]/90">
          Haute Braise &bull; Agoé Assiyéyé
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="absolute bottom-6 text-[10px] uppercase tracking-widest text-white/40 hover:text-white/80 min-h-[44px] min-w-[44px] inline-flex items-center justify-center py-2.5 px-4"
      >
        Passer
      </button>
    </aside>
  );
};
