import React, { useEffect, useRef, useState } from 'react';
import { FutureWish } from '../types';

interface ConstellationCanvasProps {
  wishes: FutureWish[];
  onSelectWish: (wish: FutureWish) => void;
}

interface StarNode {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  opacity: number;
  glow: boolean;
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({ wishes, onSelectWish }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);

  // Hardcode beautiful relative points for shapes on a normalized 0-100 canvas grid
  const shapes: Record<'house' | 'ring' | 'star' | 'house' | 'plane' | 'heart', { x: number; y: number }[]> = {
    house: [
      { x: 50, y: 15 }, // Roof top
      { x: 25, y: 38 }, // Roof left
      { x: 75, y: 38 }, // Roof right
      { x: 25, y: 75 }, // Bottom left
      { x: 75, y: 75 }, // Bottom right
      { x: 50, y: 15 }, // Connect back to roof
      { x: 75, y: 38 }, // Diagonal connection
      { x: 25, y: 38 },
      { x: 25, y: 75 },
      { x: 75, y: 75 }
    ],
    ring: [
      { x: 50, y: 15 }, // Diamond top
      { x: 42, y: 25 }, // Diamond left
      { x: 58, y: 25 }, // Diamond right
      { x: 50, y: 33 }, // Diamond bottom
      { x: 50, y: 15 },
      // Ring circle points
      { x: 30, y: 45 },
      { x: 22, y: 65 },
      { x: 32, y: 85 },
      { x: 50, y: 92 },
      { x: 68, y: 85 },
      { x: 78, y: 65 },
      { x: 70, y: 45 },
      { x: 50, y: 33 },
      { x: 30, y: 45 }
    ],
    plane: [
      { x: 50, y: 10 }, // Nose
      { x: 48, y: 40 }, // Fuselage mid left
      { x: 15, y: 55 }, // Wing tip left
      { x: 48, y: 65 }, // Fuselage back left
      { x: 40, y: 88 }, // Tail left
      { x: 50, y: 82 }, // Tail center
      { x: 60, y: 88 }, // Tail right
      { x: 52, y: 65 }, // Fuselage back right
      { x: 85, y: 55 }, // Wing tip right
      { x: 52, y: 40 }, // Fuselage mid right
      { x: 50, y: 10 }  // Back to nose
    ],
    heart: [
      { x: 50, y: 30 }, // Center cleft
      { x: 35, y: 12 }, // Top left arch
      { x: 18, y: 20 }, // Left edge
      { x: 15, y: 42 }, // Left mid
      { x: 32, y: 68 }, // Bottom curve left
      { x: 50, y: 90 }, // Bottom point
      { x: 68, y: 68 }, // Bottom curve right
      { x: 85, y: 42 }, // Right mid
      { x: 82, y: 20 }, // Right edge
      { x: 65, y: 12 }, // Top right arch
      { x: 50, y: 30 }  // Back to center
    ],
    star: [
      { x: 50, y: 10 },
      { x: 63, y: 38 },
      { x: 92, y: 38 },
      { x: 68, y: 58 },
      { x: 78, y: 90 },
      { x: 50, y: 70 },
      { x: 22, y: 90 },
      { x: 32, y: 58 },
      { x: 8, y: 38 },
      { x: 37, y: 38 },
      { x: 50, y: 10 }
    ]
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = Math.min(canvas.parentElement?.clientWidth || 500, 500));
    let height = (canvas.height = width);

    // Dynamic scale helper
    const getX = (pct: number) => (pct / 100) * width;
    const getY = (pct: number) => (pct / 100) * height;

    // Define positions of the 4 interactive Constellation Stars
    // Spread them out in the four quadrants
    const starCenters = [
      { id: wishes[0]?.id, wish: wishes[0], x: 25, y: 25, label: wishes[0]?.starName || "Star 1" },
      { id: wishes[1]?.id, wish: wishes[1], x: 75, y: 25, label: wishes[1]?.starName || "Star 2" },
      { id: wishes[2]?.id, wish: wishes[2], x: 25, y: 75, label: wishes[2]?.starName || "Star 3" },
      { id: wishes[3]?.id, wish: wishes[3], x: 75, y: 75, label: wishes[3]?.starName || "Star 4" }
    ];

    // Background floating dust stars
    const dustStars: { x: number; y: number; size: number; phase: number; speed: number }[] = [];
    for (let i = 0; i < 60; i++) {
      dustStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01
      });
    }

    // Capture click events on canvas
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if clicked near any of the starCenters (within 35px)
      for (const star of starCenters) {
        const sx = getX(star.x);
        const sy = getY(star.y);
        const dist = Math.hypot(clickX - sx, clickY - sy);

        if (dist < 40) {
          setSelectedWishId(star.id);
          if (star.wish) {
            onSelectWish(star.wish);
          }
          break;
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // Draw Loop
    let time = 0;
    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw dust stars with twinkle
      dustStars.forEach((star) => {
        star.phase += star.speed;
        const opacity = Math.abs(Math.sin(star.phase)) * 0.6 + 0.2;
        ctx.fillStyle = `rgba(255, 253, 248, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw active constellation shapes if selected
      const activeStar = starCenters.find((s) => s.id === selectedWishId);
      if (activeStar && activeStar.wish) {
        const shapeType = activeStar.wish.constellationShape;
        const pts = shapes[shapeType] || shapes.star;

        ctx.save();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)'; // Gold constellation lines
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 2]); // Dotted stellar maps
        ctx.beginPath();

        // Draw drawing-in animation over time
        const drawingLimit = Math.min(pts.length, Math.floor(time * 12) % (pts.length * 2));
        pts.forEach((pt, idx) => {
          // Translate the shape so it is centered on the activeStar quadrant
          const px = getX(activeStar.x) + (pt.x - 50) * (width * 0.0035);
          const py = getY(activeStar.y) + (pt.y - 50) * (height * 0.0035);

          if (idx === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }

          // Small stellar joint dots
          ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw main 4 Interactive Core Stars
      starCenters.forEach((star) => {
        const sx = getX(star.x);
        const sy = getY(star.y);
        const isSelected = star.id === selectedWishId;
        const bounce = Math.sin(time * 2 + star.x) * 3;

        ctx.save();
        // Star Pulse Glow
        const pulse = Math.sin(time * 3) * 6 + 12;
        const gradient = ctx.createRadialGradient(sx, sy + bounce, 1, sx, sy + bounce, pulse + (isSelected ? 10 : 0));
        
        if (isSelected) {
          gradient.addColorStop(0, 'rgba(212, 175, 55, 0.9)'); // Gold core
          gradient.addColorStop(0.3, 'rgba(212, 175, 55, 0.4)');
          gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 253, 248, 0.9)'); // Warm white core
          gradient.addColorStop(0.3, 'rgba(250, 218, 221, 0.3)');
          gradient.addColorStop(1, 'rgba(250, 218, 221, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sx, sy + bounce, pulse + (isSelected ? 10 : 0), 0, Math.PI * 2);
        ctx.fill();

        // Core bright star dot
        ctx.fillStyle = isSelected ? '#D4AF37' : '#FFFDF8';
        ctx.beginPath();
        ctx.arc(sx, sy + bounce, isSelected ? 4.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Label text below star
        ctx.fillStyle = isSelected ? '#D4AF37' : 'rgba(255, 253, 248, 0.7)';
        ctx.font = '500 11px Inter';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.fillText(star.label, sx, sy + bounce + 18);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      width = canvas.width = Math.min(canvas.parentElement?.clientWidth || 500, 500);
      height = canvas.height = width;
    };
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('click', handleCanvasClick);
      resizeObserver.disconnect();
    };
  }, [wishes, selectedWishId, onSelectWish]);

  // Initial trigger to select first wish
  useEffect(() => {
    if (wishes.length > 0 && !selectedWishId) {
      setSelectedWishId(wishes[0].id);
      onSelectWish(wishes[0]);
    }
  }, [wishes, selectedWishId, onSelectWish]);

  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[500px] aspect-square rounded-full border border-yellow-500/10 bg-midnight-900/40 shadow-inner cursor-pointer"
        id="constellation-canvas"
      />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none text-base text-center text-pink-300/60 font-handwritten whitespace-nowrap">
        ✨ Touch the glowing stars...
      </div>
    </div>
  );
};
