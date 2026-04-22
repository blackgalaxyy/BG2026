import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000, active: false });
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouseRef.current.active = false;
        return;
      }
      mouseRef.current.prevX = mouseRef.current.active ? mouseRef.current.x : x;
      mouseRef.current.prevY = mouseRef.current.active ? mouseRef.current.y : y;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.active = true;

      // Spawn particles based on movement speed
      const dx = mouseRef.current.x - mouseRef.current.prevX;
      const dy = mouseRef.current.y - mouseRef.current.prevY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const count = Math.min(6, Math.max(1, Math.floor(speed / 4)));

      for (let i = 0; i < count; i++) {
        const t = i / count;
        const px = mouseRef.current.prevX + dx * t;
        const py = mouseRef.current.prevY + dy * t;
        const angle = Math.random() * Math.PI * 2;
        const sp = 0.3 + Math.random() * 1.2;
        particlesRef.current.push({
          x: px + (Math.random() - 0.5) * 4,
          y: py + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * sp + dx * 0.04,
          vy: Math.sin(angle) * sp + dy * 0.04 - 0.3,
          life: 0,
          maxLife: 60 + Math.random() * 40,
          size: 1.2 + Math.random() * 2.4,
          hue: 18 + Math.random() * 22,
        });
      }
      // Cap particles
      if (particlesRef.current.length > 600) {
        particlesRef.current.splice(0, particlesRef.current.length - 600);
      }
    };

    const handleLeave = () => { mouseRef.current.active = false; };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const arr = particlesRef.current;
      ctx.globalCompositeOperation = 'lighter';

      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 - 0.02; // slight upward drift
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio >= 1) {
          arr.splice(i, 1);
          continue;
        }
        const alpha = (1 - lifeRatio) * 0.85;
        const size = p.size * (1 - lifeRatio * 0.4);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${alpha})`);
        grad.addColorStop(0.4, `hsla(${p.hue - 5}, 100%, 50%, ${alpha * 0.5})`);
        grad.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
