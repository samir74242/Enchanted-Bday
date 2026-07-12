import React, { useEffect, useRef } from 'react';

interface ConfettiFireworksProps {
  effects: ('petals' | 'hearts' | 'stars' | 'fireworks' | 'lanterns')[];
}

export const ConfettiFireworks: React.FC<ConfettiFireworksProps> = ({ effects }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle Classes
    class Petal {
      x = Math.random() * width;
      y = Math.random() * -height - 20;
      size = Math.random() * 8 + 6;
      speedX = Math.random() * 1.5 - 0.5;
      speedY = Math.random() * 1.2 + 0.8;
      angle = Math.random() * Math.PI * 2;
      spinSpeed = Math.random() * 0.02 - 0.01;
      opacity = Math.random() * 0.4 + 0.5;
      color = `rgba(250, 218, 221, ${this.opacity})`; // Soft Pink

      update() {
        this.x += this.speedX + Math.sin(this.angle) * 0.5;
        this.y += this.speedY;
        this.angle += this.spinSpeed;
        if (this.y > height) {
          this.y = -20;
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Draw a heart-shaped or oval petal
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size, -this.size, -this.size * 1.5, this.size / 3, 0, this.size);
        ctx.bezierCurveTo(this.size * 1.5, this.size / 3, this.size, -this.size, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    }

    class Heart {
      x = Math.random() * width;
      y = height + Math.random() * 100 + 20;
      size = Math.random() * 10 + 6;
      speedY = Math.random() * 0.8 + 0.5;
      speedX = Math.random() * 0.6 - 0.3;
      wiggle = Math.random() * 0.02;
      wiggleSpeed = Math.random() * 0.05 + 0.01;
      opacity = Math.random() * 0.3 + 0.4;
      scale = 1;

      update() {
        this.y -= this.speedY;
        this.x += Math.sin(this.wiggle) * 0.4 + this.speedX;
        this.wiggle += this.wiggleSpeed;
        if (this.y < -20) {
          this.y = height + 20;
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.fillStyle = `rgba(250, 112, 152, ${this.opacity})`; // Pink-rose heart
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size / 2, -this.size / 2, -this.size, -this.size / 3, -this.size, 0);
        ctx.bezierCurveTo(-this.size, this.size / 2, -this.size / 2, this.size * 0.8, 0, this.size * 1.2);
        ctx.bezierCurveTo(this.size / 2, this.size * 0.8, this.size, this.size / 2, this.size, 0);
        ctx.bezierCurveTo(this.size, -this.size / 3, this.size / 2, -this.size / 2, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    }

    class Star {
      x = Math.random() * width;
      y = Math.random() * height;
      size = Math.random() * 1.2 + 0.4;
      sparkleSpeed = Math.random() * 0.03 + 0.005;
      angle = Math.random() * Math.PI;
      brightness = Math.random() * 0.5 + 0.4;

      update() {
        this.angle += this.sparkleSpeed;
        this.brightness = Math.abs(Math.sin(this.angle));
      }

      draw() {
        ctx.fillStyle = `rgba(255, 253, 248, ${this.brightness * 0.8})`; // Warm white
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Occasional luxury 4-point sparkle
        if (this.size > 1.2 && this.brightness > 0.8) {
          ctx.strokeStyle = `rgba(212, 175, 55, ${this.brightness * 0.4})`; // Gold
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(this.x - 4, this.y);
          ctx.lineTo(this.x + 4, this.y);
          ctx.moveTo(this.x, this.y - 4);
          ctx.lineTo(this.x, this.y + 4);
          ctx.stroke();
        }
      }
    }

    class Firework {
      x = Math.random() * width;
      y = height;
      targetY = Math.random() * (height * 0.4) + height * 0.1;
      speedY = Math.random() * 4 + 5;
      exploded = false;
      particles: FireworkParticle[] = [];
      color = `hsl(${Math.random() * 360}, 90%, 75%)`; // Beautiful pastel/neon colors

      update() {
        if (!this.exploded) {
          this.y -= this.speedY;
          if (this.y <= this.targetY) {
            this.exploded = true;
            this.explode();
          }
        } else {
          this.particles.forEach((p) => p.update());
          this.particles = this.particles.filter((p) => p.alpha > 0);
        }
      }

      explode() {
        const count = Math.floor(Math.random() * 40) + 40;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3.5 + 0.5;
          this.particles.push(new FireworkParticle(this.x, this.y, angle, speed, this.color));
        }
      }

      draw() {
        if (!this.exploded) {
          ctx.fillStyle = '#D4AF37'; // Gold rocket trail
          ctx.beginPath();
          ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          this.particles.forEach((p) => p.draw());
        }
      }
    }

    class FireworkParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha = 1;
      decay = Math.random() * 0.015 + 0.012;
      gravity = 0.04;

      constructor(x: number, y: number, angle: number, speed: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy + this.gravity;
        this.vy += this.gravity;
        this.alpha -= this.decay;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.random() * 1.5 + 1, 0, Math.PI * 2);
        ctx.fill();

        // Soft glow for sparkles
        if (Math.random() > 0.5) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = this.color;
        }
        ctx.restore();
      }
    }

    class Lantern {
      x = Math.random() * width;
      y = height + Math.random() * 150;
      size = Math.random() * 8 + 6;
      speedY = Math.random() * 0.4 + 0.2;
      sway = Math.random() * 100;
      swaySpeed = Math.random() * 0.01 + 0.005;
      color = `rgba(212, 175, 55, ${Math.random() * 0.3 + 0.5})`; // Floating gold glowing lantern

      update() {
        this.y -= this.speedY;
        this.x += Math.sin(this.sway) * 0.25;
        this.sway += this.swaySpeed;
        if (this.y < -30) {
          this.y = height + 30;
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
        ctx.fillStyle = this.color;
        // Draw soft rectangles as paper lanterns
        ctx.beginPath();
        ctx.roundRect(-this.size / 2, -this.size, this.size, this.size * 1.3, 2);
        ctx.fill();

        // Little gold thread hanger hanging below
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, this.size * 0.3);
        ctx.lineTo(0, this.size * 0.7);
        ctx.stroke();

        ctx.restore();
      }
    }

    // Instantiation loops
    const petalsList: Petal[] = [];
    const heartsList: Heart[] = [];
    const starsList: Star[] = [];
    const fireworksList: Firework[] = [];
    const lanternsList: Lantern[] = [];

    const setupParticles = () => {
      petalsList.length = 0;
      heartsList.length = 0;
      starsList.length = 0;
      fireworksList.length = 0;
      lanternsList.length = 0;

      if (effects.includes('stars')) {
        for (let i = 0; i < 150; i++) starsList.push(new Star());
      }
      if (effects.includes('petals')) {
        for (let i = 0; i < 40; i++) petalsList.push(new Petal());
      }
      if (effects.includes('hearts')) {
        for (let i = 0; i < 30; i++) heartsList.push(new Heart());
      }
      if (effects.includes('lanterns')) {
        for (let i = 0; i < 20; i++) lanternsList.push(new Lantern());
      }
    };

    setupParticles();

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      setupParticles();
    };
    window.addEventListener('resize', handleResize);

    let fireworkTimer = 0;

    const animate = () => {
      // Clear with very slight fade trails if fireworks are active
      if (effects.includes('fireworks')) {
        ctx.fillStyle = 'rgba(8, 18, 41, 0.15)'; // Dark midnight trail
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // 1. Stars Update and Draw
      if (effects.includes('stars')) {
        starsList.forEach((star) => {
          star.update();
          star.draw();
        });
      }

      // 2. Petals Update and Draw
      if (effects.includes('petals')) {
        petalsList.forEach((petal) => {
          petal.update();
          petal.draw();
        });
      }

      // 3. Hearts Update and Draw
      if (effects.includes('hearts')) {
        heartsList.forEach((heart) => {
          heart.update();
          heart.draw();
        });
      }

      // 4. Lanterns Update and Draw
      if (effects.includes('lanterns')) {
        lanternsList.forEach((lantern) => {
          lantern.update();
          lantern.draw();
        });
      }

      // 5. Fireworks Spawn, Update, Draw
      if (effects.includes('fireworks')) {
        fireworkTimer++;
        if (fireworkTimer > 35) {
          // Spawn rate
          if (fireworksList.length < 5) {
            fireworksList.push(new Firework());
          }
          fireworkTimer = 0;
        }

        for (let i = fireworksList.length - 1; i >= 0; i--) {
          const firework = fireworksList[i];
          firework.update();
          firework.draw();
          // Remove if exploded and all particles decayed
          if (firework.exploded && firework.particles.length === 0) {
            fireworksList.splice(i, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effects]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full block"
      id="confetti-fireworks-canvas"
    />
  );
};
