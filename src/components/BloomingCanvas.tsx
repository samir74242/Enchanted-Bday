import React, { useEffect, useRef } from 'react';

interface BloomingCanvasProps {
  active: boolean;
  onComplete: () => void;
}

export const BloomingCanvas: React.FC<BloomingCanvasProps> = ({ active, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Vine Structure
    interface Branch {
      x: number;
      y: number;
      angle: number;
      speed: number;
      width: number;
      length: number;
      maxLength: number;
      childrenSprouted: boolean;
    }

    interface Flower {
      x: number;
      y: number;
      maxSize: number;
      currentSize: number;
      color: string;
      petals: number;
    }

    const branches: Branch[] = [];
    const flowers: Flower[] = [];

    // Start with 6 core branches winding outward from the center
    const centerX = width / 2;
    const centerY = height / 2;
    const branchCount = 8;

    for (let i = 0; i < branchCount; i++) {
      const angle = (i * Math.PI * 2) / branchCount + (Math.random() * 0.2 - 0.1);
      branches.push({
        x: centerX,
        y: centerY,
        angle,
        speed: Math.random() * 2 + 2.5,
        width: 4.5,
        length: 0,
        maxLength: Math.min(width, height) * 0.45 + Math.random() * 80,
        childrenSprouted: false
      });
    }

    const colors = [
      'rgba(250, 218, 221, 0.95)', // Soft pink
      'rgba(244, 143, 177, 0.95)', // Rose pink
      'rgba(212, 175, 55, 0.95)',  // Antique gold
      'rgba(255, 253, 248, 0.95)'  // Warm cream
    ];

    let framesElapsed = 0;
    const maxFrames = 180; // ~3 seconds at 60 FPS

    const animate = () => {
      framesElapsed++;

      // Draw subtle green vine pathways
      branches.forEach((b) => {
        if (b.length >= b.maxLength) return;

        ctx.strokeStyle = '#2D5A27'; // Cozy leaf green
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = b.width;

        ctx.beginPath();
        ctx.moveTo(b.x, b.y);

        // Wind slightly
        b.angle += Math.sin(b.length * 0.05) * 0.08;
        const nextX = b.x + Math.cos(b.angle) * b.speed;
        const nextY = b.y + Math.sin(b.angle) * b.speed;

        ctx.lineTo(nextX, nextY);
        ctx.stroke();

        // Update branch coordinates
        b.x = nextX;
        b.y = nextY;
        b.length += b.speed;

        // Occasionally sprout a flower or side leaf
        if (Math.random() > 0.88 && b.length < b.maxLength) {
          flowers.push({
            x: b.x,
            y: b.y,
            maxSize: Math.random() * 12 + 10,
            currentSize: 0,
            color: colors[Math.floor(Math.random() * colors.length)],
            petals: Math.floor(Math.random() * 3) + 5 // 5 to 7 petals
          });
        }

        // Sub-branching
        if (!b.childrenSprouted && b.length > b.maxLength * 0.4 && Math.random() > 0.95) {
          b.childrenSprouted = true;
          branches.push({
            x: b.x,
            y: b.y,
            angle: b.angle + (Math.random() > 0.5 ? 0.6 : -0.6),
            speed: b.speed * 0.85,
            width: b.width * 0.65,
            length: 0,
            maxLength: b.maxLength * 0.5,
            childrenSprouted: false
          });
        }
      });

      // Animate and draw blooming flowers
      flowers.forEach((f) => {
        if (f.currentSize < f.maxSize) {
          f.currentSize += 0.6; // Growth speed
        }

        ctx.save();
        ctx.translate(f.x, f.y);

        // Draw leaves behind the flower
        ctx.fillStyle = '#4A752C';
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, f.currentSize * 0.5, f.currentSize * 1.1, (i * Math.PI) / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw petals
        ctx.fillStyle = f.color;
        for (let i = 0; i < f.petals; i++) {
          ctx.rotate((Math.PI * 2) / f.petals);
          ctx.beginPath();
          ctx.ellipse(0, f.currentSize * 0.5, f.currentSize * 0.6, f.currentSize * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Gold glowing center
        ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, f.currentSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Transition to black curtain filling up the screen to complete the bloom fade
      if (framesElapsed > maxFrames - 30) {
        const progress = (framesElapsed - (maxFrames - 30)) / 30;
        ctx.fillStyle = `rgba(8, 18, 41, ${progress})`; // Midnight blue transition
        ctx.fillRect(0, 0, width, height);
      }

      if (framesElapsed < maxFrames) {
        animationId = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [active, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-50 pointer-events-none transition-all duration-500 ${
        active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      id="blooming-canvas"
    />
  );
};
