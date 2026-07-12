import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

export interface LanternsFireworksRef {
  spawnSmoke: (x: number, y: number) => void;
  triggerFirework: (x?: number, y?: number) => void;
}

interface LanternsFireworksProps {
  isBlownOut: boolean;
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  swaySpeed: number;
  swayAmount: number;
  swayTime: number;
}

interface Lantern {
  x: number;
  y: number;
  vy: number;
  size: number;
  opacity: number;
  swayTime: number;
  swaySpeed: number;
  swayAmount: number;
  flicker: number;
}

interface FireworkSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  gravity: number;
  resistance: number;
  fadeSpeed: number;
  sparkle?: boolean;
}

interface FireworkTrail {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  alpha: number;
  color: string;
}

export const LanternsFireworks = forwardRef<LanternsFireworksRef, LanternsFireworksProps>(
  ({ isBlownOut }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smokeParticlesRef = useRef<SmokeParticle[]>([]);
    const lanternsRef = useRef<Lantern[]>([]);
    const sparksRef = useRef<FireworkSpark[]>([]);
    const trailsRef = useRef<FireworkTrail[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    // Color palettes for fireworks
    const colors = [
      'rgba(251, 146, 60, 1)',  // Warm Amber
      'rgba(244, 63, 94, 1)',   // Rose Gold/Crimson
      'rgba(253, 224, 71, 1)',  // Champagne Gold
      'rgba(255, 255, 255, 1)', // Warm Pearl White
      'rgba(244, 114, 182, 1)', // Soft Rose Pink
    ];

    // Imperative API for Parent
    useImperativeHandle(ref, () => ({
      spawnSmoke: (x, y) => {
        // Spawn 25-30 elegant smoke particles
        for (let i = 0; i < 35; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.1 + Math.random() * 0.4;
          smokeParticlesRef.current.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: -0.4 - Math.random() * 0.8, // drifting upwards
            size: 4 + Math.random() * 6,
            alpha: 0.6 + Math.random() * 0.4,
            decay: 0.006 + Math.random() * 0.008, // slow fade
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            swaySpeed: 0.02 + Math.random() * 0.03,
            swayAmount: 0.1 + Math.random() * 0.2,
            swayTime: Math.random() * 100,
          });
        }
      },
      triggerFirework: (x, y) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const targetX = x ?? (0.2 + Math.random() * 0.6) * canvas.width;
        const targetY = y ?? (0.15 + Math.random() * 0.3) * canvas.height;
        trailsRef.current.push({
          x: targetX,
          y: canvas.height,
          targetY,
          vy: -6 - Math.random() * 4,
          alpha: 1.0,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }));

    // Periodically spawn lanterns & fireworks when blown out
    useEffect(() => {
      if (!isBlownOut) {
        // Clear all arrays
        lanternsRef.current = [];
        sparksRef.current = [];
        trailsRef.current = [];
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Spawn initial set of lanterns
      for (let i = 0; i < 12; i++) {
        lanternsRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * canvas.height,
          vy: -0.3 - Math.random() * 0.4,
          size: 15 + Math.random() * 20,
          opacity: 0.6 + Math.random() * 0.4,
          swayTime: Math.random() * 100,
          swaySpeed: 0.005 + Math.random() * 0.01,
          swayAmount: 10 + Math.random() * 15,
          flicker: Math.random() * 10,
        });
      }

      // Continuous lantern spawning
      const lanternInterval = setInterval(() => {
        if (lanternsRef.current.length < 25) {
          lanternsRef.current.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 20,
            vy: -0.3 - Math.random() * 0.4,
            size: 15 + Math.random() * 20,
            opacity: 0.6 + Math.random() * 0.4,
            swayTime: Math.random() * 100,
            swaySpeed: 0.005 + Math.random() * 0.01,
            swayAmount: 10 + Math.random() * 15,
            flicker: Math.random() * 10,
          });
        }
      }, 3000);

      // Tasteful firework trigger interval
      const fireworkInterval = setInterval(() => {
        const targetX = (0.25 + Math.random() * 0.5) * canvas.width;
        const targetY = (0.15 + Math.random() * 0.35) * canvas.height;
        trailsRef.current.push({
          x: targetX,
          y: canvas.height,
          targetY,
          vy: -7 - Math.random() * 5,
          alpha: 1.0,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }, 4000);

      return () => {
        clearInterval(lanternInterval);
        clearInterval(fireworkInterval);
      };
    }, [isBlownOut]);

    // Setup main update & drawing loop
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
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const updateAndDraw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width;
        const h = canvas.height;

        // 1. Update & Draw SMOKE
        smokeParticlesRef.current = smokeParticlesRef.current.filter((p) => {
          p.x += p.vx + Math.sin(p.swayTime) * p.swayAmount;
          p.y += p.vy;
          p.swayTime += p.swaySpeed;
          p.alpha -= p.decay;
          p.size += 0.05; // smoke puff expands
          p.rotation += p.rotationSpeed;

          if (p.alpha <= 0) return false;

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          // Draw fluffy organic smoke cloudlet
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.arc(p.size * 0.4, -p.size * 0.2, p.size * 0.7, 0, Math.PI * 2);
          ctx.arc(-p.size * 0.3, p.size * 0.1, p.size * 0.6, 0, Math.PI * 2);

          // Soft grey/white glowing smoke gradient
          const smokeGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size * 1.2);
          smokeGrad.addColorStop(0, 'rgba(240, 240, 245, 0.4)');
          smokeGrad.addColorStop(0.5, 'rgba(220, 220, 225, 0.2)');
          smokeGrad.addColorStop(1, 'rgba(200, 200, 200, 0)');

          ctx.fillStyle = smokeGrad;
          ctx.fill();
          ctx.restore();

          return true;
        });

        // 2. Update & Draw FIREWORK TRAILS
        trailsRef.current = trailsRef.current.filter((t) => {
          t.y += t.vy;

          // Draw trail
          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(t.x, t.y - t.vy * 1.5);
          ctx.strokeStyle = t.color.replace('1)', `${t.alpha * 0.6})`);
          ctx.lineWidth = 2.5;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset

          // If reached target, explode!
          if (t.y <= t.targetY) {
            // Spawn spark bursts
            const sparkCount = 100 + Math.floor(Math.random() * 40);
            for (let i = 0; i < sparkCount; i++) {
              const angle = Math.random() * Math.PI * 2;
              const force = 1.5 + Math.random() * 4.5;
              sparksRef.current.push({
                x: t.x,
                y: t.y,
                vx: Math.cos(angle) * force,
                vy: Math.sin(angle) * force - 0.5,
                alpha: 1.0,
                size: 1 + Math.random() * 1.8,
                color: t.color,
                gravity: 0.05 + Math.random() * 0.04,
                resistance: 0.96 + Math.random() * 0.02,
                fadeSpeed: 0.01 + Math.random() * 0.012,
                sparkle: Math.random() > 0.4,
              });
            }
            return false; // remove trail
          }
          return true;
        });

        // 3. Update & Draw SPARKS
        sparksRef.current = sparksRef.current.filter((s) => {
          s.vx *= s.resistance;
          s.vy = (s.vy * s.resistance) + s.gravity;
          s.x += s.vx;
          s.y += s.vy;
          s.alpha -= s.fadeSpeed;

          if (s.alpha <= 0) return false;

          ctx.save();
          // Sparkling effect
          let alpha = s.alpha;
          if (s.sparkle && Math.random() > 0.5) {
            alpha = s.alpha * 0.3;
          }

          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = s.color;
          ctx.fill();
          ctx.restore();

          return true;
        });

        // 4. Update & Draw FLOATING LANTERNS
        lanternsRef.current = lanternsRef.current.filter((l) => {
          l.swayTime += l.swaySpeed;
          l.x += Math.sin(l.swayTime) * 0.15;
          l.y += l.vy;
          l.flicker += 0.15;

          // Float off screen completely
          if (l.y < -l.size * 2) {
            return false;
          }

          ctx.save();
          ctx.globalAlpha = l.opacity;
          ctx.translate(l.x, l.y);

          // Draw romantic sky lantern shape
          const w = l.size;
          const h = l.size * 1.35;

          // Soft flicker value
          const glowScale = 1 + Math.sin(l.flicker) * 0.12;

          // Glow shadow
          ctx.shadowBlur = 15 * glowScale;
          ctx.shadowColor = 'rgba(251, 146, 60, 0.75)';

          // Outer translucent lantern frame
          ctx.beginPath();
          ctx.moveTo(-w/2, -h/2);
          ctx.lineTo(w/2, -h/2);
          ctx.lineTo(w * 0.45, h/2);
          ctx.lineTo(-w * 0.45, h/2);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, -h/2, 0, h/2);
          grad.addColorStop(0, 'rgba(254, 215, 170, 0.9)'); // very bright warm orange
          grad.addColorStop(0.6, 'rgba(251, 146, 60, 0.8)'); // warm amber
          grad.addColorStop(1, 'rgba(239, 68, 68, 0.9)');   // dark rich red-orange bottom

          ctx.fillStyle = grad;
          ctx.fill();

          // Black wire frame bottom plate
          ctx.beginPath();
          ctx.moveTo(-w * 0.45, h/2);
          ctx.lineTo(w * 0.45, h/2);
          ctx.strokeStyle = 'rgba(30,30,30,0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Candle core burner glow inside bottom
          const burnerGrad = ctx.createRadialGradient(0, h/2 - 4, 1, 0, h/2 - 4, w * 0.4);
          burnerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          burnerGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.9)');
          burnerGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');

          ctx.beginPath();
          ctx.arc(0, h/2 - 4, w * 0.4, 0, Math.PI, true);
          ctx.fillStyle = burnerGrad;
          ctx.fill();

          ctx.restore();

          return true;
        });

        animationFrameRef.current = requestAnimationFrame(updateAndDraw);
      };

      updateAndDraw();

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isBlownOut]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
        id="smoke-lanterns-fireworks-canvas"
      />
    );
  }
);

LanternsFireworks.displayName = 'LanternsFireworks';
