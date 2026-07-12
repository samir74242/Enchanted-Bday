import React, { useEffect, useRef } from 'react';

interface AtmosphereCanvasProps {
  parallaxOffset: { x: number; y: number };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: 'dust' | 'bokeh' | 'petal';
  color: string;
  rotation?: number;
  rotationSpeed?: number;
  swaySpeed?: number;
  swayAmount?: number;
  swayOffset?: number;
}

export const AtmosphereCanvas: React.FC<AtmosphereCanvasProps> = ({ parallaxOffset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      initParticles();
    };

    const initParticles = () => {
      const particles: Particle[] = [];
      const width = canvas.width;
      const height = canvas.height;

      // 1. Dust Particles (tiny, rising)
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.4,
          size: 1 + Math.random() * 2,
          opacity: 0.2 + Math.random() * 0.5,
          type: 'dust',
          color: `rgba(253, 224, 71, ${0.3 + Math.random() * 0.5})`, // golden dust
        });
      }

      // 2. Bokeh (large, slow, drifting)
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.1 - Math.random() * 0.2,
          size: 25 + Math.random() * 50,
          opacity: 0.05 + Math.random() * 0.08,
          type: 'bokeh',
          color: Math.random() > 0.5 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(244, 63, 94, 0.1)', // amber or rose
        });
      }

      // 3. Rose Petals (drifting down, swaying)
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: Math.random() * width,
          y: -50 - Math.random() * height,
          vx: -0.3 - Math.random() * 0.6,
          vy: 0.6 + Math.random() * 1.0,
          size: 6 + Math.random() * 8,
          opacity: 0.4 + Math.random() * 0.5,
          type: 'petal',
          color: `rgba(${210 + Math.floor(Math.random() * 45)}, ${40 + Math.floor(Math.random() * 30)}, ${70 + Math.floor(Math.random() * 40)}, 1)`, // rose-pink-reds
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          swaySpeed: 0.01 + Math.random() * 0.02,
          swayAmount: 15 + Math.random() * 20,
          swayOffset: Math.random() * 100,
        });
      }

      particlesRef.current = particles;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Parallax shifts
      const px = parallaxOffset.x * 0.05;
      const py = parallaxOffset.y * 0.05;

      particlesRef.current.forEach((p) => {
        // Move particles
        if (p.type === 'petal') {
          // Petal swaying horizontal motion
          if (p.swayOffset !== undefined && p.swaySpeed !== undefined && p.swayAmount !== undefined) {
            p.swayOffset += p.swaySpeed;
            p.x += p.vx + Math.sin(p.swayOffset) * 0.3;
          } else {
            p.x += p.vx;
          }
          p.y += p.vy;
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed;
          }

          // Reset if out of bounds
          if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
            p.y = -20;
            p.x = Math.random() * width;
            p.vy = 0.6 + Math.random() * 1.0;
            p.vx = -0.3 - Math.random() * 0.6;
          }
        } else {
          // Dust & Bokeh rising
          p.x += p.vx;
          p.y += p.vy;

          if (p.y < -p.size * 2) {
            p.y = height + p.size * 2;
            p.x = Math.random() * width;
          }
          if (p.x < -p.size * 2) p.x = width + p.size * 2;
          if (p.x > width + p.size * 2) p.x = -p.size * 2;
        }

        // Apply Parallax to render coords only (don't update base physics with parallax to avoid accumulation)
        let rx = p.x + (p.type === 'bokeh' ? px * 0.5 : p.type === 'petal' ? px * 1.2 : px);
        let ry = p.y + (p.type === 'bokeh' ? py * 0.5 : p.type === 'petal' ? py * 1.2 : py);

        ctx.save();
        ctx.globalAlpha = p.opacity;

        if (p.type === 'dust') {
          ctx.beginPath();
          ctx.arc(rx, ry, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#fde047';
          ctx.fill();
        } else if (p.type === 'bokeh') {
          const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, p.size);
          grad.addColorStop(0, p.color);
          grad.addColorStop(0.5, p.color.replace('0.15', '0.05').replace('0.1', '0.03'));
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(rx, ry, p.size, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        } else if (p.type === 'petal') {
          // Draw a beautiful organic petal
          ctx.translate(rx, ry);
          if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
          }
          ctx.beginPath();
          // Heart-shaped or teardrop petal
          const r = p.size;
          ctx.moveTo(0, -r/2);
          ctx.bezierCurveTo(-r, -r, -r, r/2, 0, r);
          ctx.bezierCurveTo(r, r/2, r, -r, 0, -r/2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 2;
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [parallaxOffset]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      style={{ mixBlendMode: 'screen' }}
      id="atmospheric-particle-canvas"
    />
  );
};
