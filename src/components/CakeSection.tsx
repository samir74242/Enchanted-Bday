import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mic, Volume2, Heart, RefreshCw, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AtmosphereCanvas } from './AtmosphereCanvas';
import { LanternsFireworks, LanternsFireworksRef } from './LanternsFireworks';
import { useBlowDetection } from '../hooks/useBlowDetection';

interface CakeSectionProps {
  herName: string;
  onBlowOut: () => void;
}

const DriedFlower: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative pointer-events-none select-none ${className}`}>
      {/* Main stem */}
      <div className="w-[1.5px] h-14 bg-amber-900/60 rounded-full relative">
        {/* Soft detailed branches and small white baby's breath buds */}
        <div className="absolute bottom-6 -left-2.5 w-3.5 h-[1px] bg-amber-950/40 rotate-[-25deg] origin-right" />
        <div className="absolute bottom-7 -left-3.5 w-1.5 h-1.5 bg-stone-100 rounded-full shadow-sm opacity-90 border-[0.3px] border-stone-200" />

        <div className="absolute bottom-8 -right-3 w-4 h-[1px] bg-amber-950/40 rotate-[20deg] origin-left" />
        <div className="absolute bottom-9 -right-4.5 w-1.5 h-1.5 bg-stone-100 rounded-full shadow-sm opacity-90 border-[0.3px] border-stone-200" />

        <div className="absolute top-3 -left-2 w-3 h-[1px] bg-amber-950/40 rotate-[-15deg] origin-right" />
        <div className="absolute top-3.5 -left-3 w-1.5 h-1.5 bg-stone-100 rounded-full shadow-sm opacity-90 border-[0.3px] border-stone-200" />

        <div className="absolute top-1 -right-2.5 w-3 h-[1px] bg-amber-950/40 rotate-[15deg] origin-left" />
        <div className="absolute top-1.5 -right-3.5 w-1.5 h-1.5 bg-stone-100 rounded-full shadow-sm opacity-90 border-[0.3px] border-stone-200" />

        <div className="absolute -top-1 left-0 w-1.5 h-1.5 bg-stone-100 rounded-full shadow-sm opacity-95 border-[0.3px] border-stone-100" />
      </div>
    </div>
  );
};

interface CandleState {
  id: number;
  leftPercent: number; // relative placement on cake
  topPercent: number;
  lit: boolean;
  smokeSpawned: boolean;
}

export const CakeSection: React.FC<CakeSectionProps> = ({
  herName,
  onBlowOut
}) => {
  // Cinematic Flow Stages: 'intro' | 'active' | 'blowing' | 'blown' | 'fairy_lights' | 'typewriter' | 'finale'
  const [flowStage, setFlowStage] = useState<'intro' | 'active' | 'blown' | 'fairy_lights' | 'typewriter' | 'finale'>('intro');
  const [micEnabled, setMicEnabled] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [blowProgress, setBlowProgress] = useState(0); // 0 to 1
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);

  const cakeContainerRef = useRef<HTMLDivElement>(null);
  const effectsRef = useRef<LanternsFireworksRef>(null);

  // 5 Candles placed in a 3D perspective arc on the cake surface
  const [candles, setCandles] = useState<CandleState[]>([
    { id: 1, leftPercent: 18, topPercent: 32, lit: true, smokeSpawned: false },
    { id: 2, leftPercent: 34, topPercent: 44, lit: true, smokeSpawned: false },
    { id: 3, leftPercent: 50, topPercent: 48, lit: true, smokeSpawned: false },
    { id: 4, leftPercent: 66, topPercent: 44, lit: true, smokeSpawned: false },
    { id: 5, leftPercent: 82, topPercent: 32, lit: true, smokeSpawned: false },
  ]);

  // Track mouse move for parallax camera
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX - window.innerWidth / 2) * 0.12;
      const y = (clientY - window.innerHeight / 2) * 0.12;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle blow progress updates from Web Audio Hook
  const handleBlowProgress = (progress: number) => {
    setBlowProgress(progress);
  };

  // Triggered when a sustained blowing is successfully detected
  const handleBlowSuccess = () => {
    extinguishAllCandlesGradually();
  };

  // Initialize Microphone Blow Detection
  const { startListening, stopListening, micPermission, errorMsg } = useBlowDetection({
    onBlowProgress: handleBlowProgress,
    onBlowSuccess: handleBlowSuccess,
    enabled: micEnabled && flowStage === 'active',
  });

  // Handle start click
  const handleStartSurprise = async () => {
    setFlowStage('active');
    setMicEnabled(true);
    await startListening();
  };

  // If permission is denied, show the custom elegant popup
  useEffect(() => {
    if (micPermission === 'denied') {
      setShowErrorModal(true);
      setMicEnabled(false);
    }
  }, [micPermission]);

  // Manual candle tap/click extinguish fallback
  const handleCandleTap = (id: number) => {
    setCandles((prev) =>
      prev.map((c) => {
        if (c.id === id && c.lit) {
          triggerSmokePuff(c);
          return { ...c, lit: false };
        }
        return c;
      })
    );
  };

  // Extinguish all candles one by one randomly to feel organic
  const extinguishAllCandlesGradually = () => {
    stopListening();
    setMicEnabled(false);
    setBlowProgress(0);

    const activeCandles = candles.filter((c) => c.lit);
    if (activeCandles.length === 0) return;

    // Shuffle active candles for random extinguishing order
    const shuffled = [...activeCandles].sort(() => Math.random() - 0.5);

    shuffled.forEach((candle, index) => {
      setTimeout(() => {
        setCandles((prev) =>
          prev.map((c) => {
            if (c.id === candle.id && c.lit) {
              triggerSmokePuff(c);
              return { ...c, lit: false };
            }
            return c;
          })
        );
      }, index * (250 + Math.random() * 200)); // Organic staggered intervals
    });
  };

  // Trigger a curling smoke puff at the exact wick coordinate
  const triggerSmokePuff = (candle: CandleState) => {
    if (!cakeContainerRef.current || !effectsRef.current) return;

    const cakeRect = cakeContainerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Compute coordinate relative to viewport and tell the canvas to spawn particles there
    const wickX = cakeRect.left + (candle.leftPercent / 100) * cakeRect.width;
    // The top coordinates are placed based on candle heights (wick is roughly 75px above placement point)
    const wickY = cakeRect.top + (candle.topPercent / 100) * cakeRect.height - 70;

    effectsRef.current.spawnSmoke(wickX, wickY);
  };

  // Monitor when all candles go out to trigger celebrations
  const allCandlesOut = candles.every((c) => !c.lit);

  useEffect(() => {
    if (allCandlesOut && flowStage === 'active') {
      setFlowStage('blown');
      triggerCelebrationFlow();
    }
  }, [allCandlesOut, flowStage]);

  // Sequence the magical visual events after candles are extinguished
  const triggerCelebrationFlow = () => {
    // 1. Instantly launch gold & rose-gold metallic confetti
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#f59e0b', '#fef3c7', '#ffffff', '#fb7185', '#fda4af'], // Amber Gold, Cream, White, Rose Gold, Pink Pearl
      gravity: 0.8,
      scalar: 1.1,
    });

    // Staggered secondary explosion for depth
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#ffffff', '#f43f5e'],
        gravity: 0.6,
        scalar: 0.9,
      });
    }, 550);

    // 2. Fairy lights string fade in after 1.2s
    setTimeout(() => {
      setFlowStage('fairy_lights');
    }, 1200);

    // 3. Typewriter message fade in after 2.6s
    setTimeout(() => {
      setFlowStage('typewriter');
    }, 2800);

    // 4. Final surprise and Continue CTA after 7s
    setTimeout(() => {
      setFlowStage('finale');
    }, 7500);
  };

  return (
    <div
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-radial from-neutral-900 via-stone-950 to-black text-white p-4"
      id="cinematic-birthday-cake-container"
    >
      {/* 1. ATMOSPHERE BACKGROUND (Bokeh, Rose Petals, Dust) */}
      <AtmosphereCanvas parallaxOffset={parallax} />

      {/* 2. LANTERNS, SMOKE, AND FIREWORKS CANVAS */}
      <LanternsFireworks ref={effectsRef} isBlownOut={flowStage !== 'intro' && flowStage !== 'active'} />

      {/* 3. WARM FAIRY LIGHTS DECORATION (Appears when blown) */}
      <AnimatePresence>
        {(flowStage === 'fairy_lights' || flowStage === 'typewriter' || flowStage === 'finale') && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute top-0 left-0 w-full z-10 flex justify-around px-8 pointer-events-none"
            id="glowing-fairy-lights"
          >
            {/* Elegant glowing yellow/amber hanging fairy light bulbs */}
            <svg className="w-full h-24 absolute top-0 left-0 text-amber-300/40" viewBox="0 0 1000 100" preserveAspectRatio="none">
              <path d="M0,10 Q250,80 500,10 Q750,80 1000,10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
            </svg>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col items-center relative" style={{ marginTop: i % 2 === 0 ? '25px' : '38px' }}>
                <div className="w-[1px] h-4 bg-amber-500/50" />
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.7, 1, 0.7],
                    boxShadow: [
                      '0 0 12px #f59e0b, 0 0 4px #fbbf24',
                      '0 0 24px #f59e0b, 0 0 8px #fbbf24',
                      '0 0 12px #f59e0b, 0 0 4px #fbbf24'
                    ]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="w-3.5 h-3.5 bg-amber-200 rounded-full cursor-none"
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN INTERACTIVE CONTENT AREA */}
      <AnimatePresence mode="wait">
        {flowStage === 'intro' ? (
          /* INTRO SCREEN */
          <motion.div
            key="stage-intro"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center max-w-lg z-10 px-6 py-12 bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-3xl relative"
          >
            {/* Ambient background glow inside intro */}
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-rose-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-30 pointer-events-none" />

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-6xl mb-6"
            >
              🎂
            </motion.div>
            
            <h1 className="font-serif text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-pink-300 font-bold tracking-wide">
              Make a Wish
            </h1>

            <p className="text-sm text-neutral-300/80 mt-4 leading-relaxed font-sans max-w-sm">
              "When you're ready... blow gently into your microphone to make your dreams reach the stars."
            </p>

            <button
              onClick={handleStartSurprise}
              className="mt-8 px-8 py-3.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 text-white font-medium text-sm tracking-wider uppercase hover:shadow-2xl hover:shadow-rose-500/20 transition-all duration-300 transform active:scale-95 cursor-pointer z-10 border border-white/10"
            >
              🎤 Start Birthday Surprise
            </button>
          </motion.div>
        ) : (
          /* ACTIVE CAKE STAGE AND CELEBRATIONS */
          <div className="w-full max-w-4xl flex flex-col items-center relative z-20">
            {/* Ambient Darkening Overlay on Screen when candles are out */}
            <div 
              className="absolute inset-0 bg-black/30 pointer-events-none transition-opacity duration-1500" 
              style={{ opacity: allCandlesOut ? 1 : 0 }} 
            />

            {/* Cake container with Parallax effect */}
            <motion.div
              style={{
                transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0px) rotateX(12deg) rotateY(${parallax.x * 0.04}deg)`,
                transformStyle: 'preserve-3d',
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 60 }}
              className="relative w-80 h-96 flex flex-col justify-end items-center mb-8 select-none"
            >
              {/* Dynamic Light reflection glow on cake background (flickers in sync with candles) */}
              {!allCandlesOut && (
                <motion.div
                  animate={{
                    opacity: [0.25, 0.38, 0.28, 0.35, 0.25],
                    scale: [1, 1.05, 0.98, 1.02, 1]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="absolute bottom-24 w-72 h-44 rounded-full bg-gradient-to-t from-amber-500/20 to-transparent blur-2xl pointer-events-none z-0"
                />
              )}

              {/* FIVE PREMIUM CANDLES */}
              <div 
                ref={cakeContainerRef}
                className="absolute inset-0 w-full h-full z-10"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {candles.map((candle, idx) => {
                  // Custom calculations for each individual candle flame skewing and scaling during blow
                  const isSlightBlow = blowProgress > 0.05;
                  const bendAngle = isSlightBlow ? blowProgress * 30 * (idx % 2 === 0 ? 1 : -0.8) : 0;
                  const scaleMult = isSlightBlow ? Math.max(0.1, 1 - blowProgress * 0.8) : 1;

                  return (
                    <div
                      key={candle.id}
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${candle.leftPercent}%`,
                        top: `${candle.topPercent}%`,
                        transform: 'translate(-50%, -100%) translateZ(10px)',
                        cursor: candle.lit ? 'pointer' : 'default',
                      }}
                      onClick={() => handleCandleTap(candle.id)}
                      onMouseEnter={() => setHoveredCandle(candle.id)}
                      onMouseLeave={() => setHoveredCandle(null)}
                    >
                      {/* FLAME GRAPHICS */}
                      <AnimatePresence>
                        {candle.lit && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: scaleMult }}
                            exit={{ opacity: 0, scale: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="relative w-8 h-12 flex flex-col justify-end items-center"
                            style={{
                              transformOrigin: 'bottom center',
                              transform: `skewX(${bendAngle}deg)`,
                            }}
                          >
                            {/* Outer candle halo glow */}
                            <motion.div 
                              animate={{
                                scale: [1, 1.1, 0.95, 1.05, 1],
                                opacity: [0.3, 0.45, 0.32, 0.4, 0.3]
                              }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                              className="absolute w-12 h-12 rounded-full bg-amber-400 blur-md bottom-1"
                            />

                            {/* Flame path SVG */}
                            <svg className="w-6 h-10 overflow-visible drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" viewBox="0 0 20 30">
                              {/* Glowing core */}
                              <motion.path
                                animate={{
                                  d: [
                                    "M10,30 Q6,20 10,2 Q14,20 10,30 Z",
                                    "M10,30 Q7,18 9,3 Q13,18 10,30 Z",
                                    "M10,30 Q5,21 11,1 Q15,21 10,30 Z",
                                    "M10,30 Q6,20 10,2 Q14,20 10,30 Z"
                                  ]
                                }}
                                transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
                                fill="url(#flameGradient)"
                              />
                              <defs>
                                <linearGradient id="flameGradient" x1="0" y1="1" x2="0" y2="0">
                                  <stop offset="0%" stopColor="#ef4444" />
                                  <stop offset="40%" stopColor="#f59e0b" />
                                  <stop offset="85%" stopColor="#fef08a" />
                                  <stop offset="100%" stopColor="#ffffff" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Wick */}
                      <div className="w-[1.5px] h-3.5 bg-neutral-800 rounded-t-sm z-10" />

                      {/* Candle Body with Realistic Wax Cylindrical Gradients */}
                      <div 
                        className={`w-3.5 h-20 rounded-t shadow-lg relative overflow-hidden border-t border-white/20 transition-all duration-300 ${
                          hoveredCandle === candle.id && candle.lit ? 'scale-105 filter brightness-110' : ''
                        }`}
                        style={{
                          background: `linear-gradient(90deg, 
                            rgba(244,63,94,0.95) 0%, 
                            rgba(251,113,133,1) 35%, 
                            rgba(244,63,94,1) 70%, 
                            rgba(190,24,74,0.95) 100%)`
                        }}
                      >
                        {/* Elegant white diagonal stripe spiraling on candle */}
                        <div className="absolute inset-0 bg-white/20 transform -skew-y-12 scale-150 translate-y-3" />
                        
                        {/* Golden wax drips */}
                        <div className="absolute top-0 left-0.5 w-[2px] h-4 bg-rose-300/60 rounded-b-full shadow" />
                        <div className="absolute top-0 right-1 w-[1.5px] h-7 bg-rose-300/40 rounded-b-full shadow" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3D SCRAPBOOK BIRTHDAY CAKE */}
              <div 
                className="relative w-[310px] h-[310px] flex items-center justify-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 1. Cake Top Surface (Matte black canvas with scrapbook collage) */}
                <div
                  className="absolute w-[290px] h-[290px] rounded-full overflow-hidden border border-neutral-800 shadow-inner flex flex-col items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, #222222 0%, #111111 100%)',
                    transform: 'translateZ(30px)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Subtle inner shadow effect */}
                  <div className="absolute inset-0 rounded-full border-[6px] border-black/40 pointer-events-none" />

                  {/* Edible Starry Sugar Pearls (Scattered random tiny dots) */}
                  {[
                    { t: '15%', l: '25%', s: '3px' },
                    { t: '22%', l: '75%', s: '4px' },
                    { t: '38%', l: '14%', s: '3px' },
                    { t: '45%', l: '88%', s: '5px' },
                    { t: '12%', l: '62%', s: '3px' },
                    { t: '65%', l: '82%', s: '4px' },
                    { t: '78%', l: '18%', s: '3px' },
                    { t: '82%', l: '65%', s: '4px' },
                    { t: '52%', l: '10%', s: '4px' },
                    { t: '28%', l: '84%', s: '3px' },
                    { t: '70%', l: '22%', s: '5px' },
                  ].map((pearl, idx) => (
                    <div
                      key={`pearl-${idx}`}
                      className="absolute bg-stone-100 rounded-full opacity-80 shadow-[0_1px_2px_rgba(255,255,255,0.4)]"
                      style={{
                        top: pearl.t,
                        left: pearl.l,
                        width: pearl.s,
                        height: pearl.s,
                      }}
                    />
                  ))}

                  {/* Cursive Handwriting Note: "you complete me" */}
                  <div className="absolute top-7 text-center w-full select-none pointer-events-none z-10">
                    <span className="font-handwritten text-[14px] font-medium tracking-widest text-neutral-300 block">
                      you complete me
                    </span>
                    <span className="text-[10px] text-red-500/80 mt-0.5 block leading-none">
                      ♥
                    </span>
                  </div>

                  {/* PHOTO 1: Young Man Mirror Selfie (Left) */}
                  <div
                    className="absolute left-4 top-14 w-[92px] h-[106px] bg-stone-100 border-[3px] border-stone-100 shadow-[0_4px_10px_rgba(0,0,0,0.6)] rotate-[-7deg] flex flex-col p-1 z-10 transition-transform duration-300 hover:rotate-[-4deg] hover:scale-105 group"
                  >
                    {/* Washi Tape */}
                    <div className="absolute -top-2 left-6 w-9 h-3.5 bg-stone-300/30 border border-stone-200/10 backdrop-blur-[1px] rotate-[15deg] shadow-sm pointer-events-none" />
                    
                    <img
                      src="/images/polaroid_image.png"
                      alt="Mirror Selfie Him"
                      className="w-full h-[76px] object-cover grayscale brightness-[90%] sepia-[15%] rounded-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex items-center justify-center">
                      <span className="font-mono text-[7px] text-neutral-500 font-bold tracking-wider">SAMRICH ❤️</span>
                    </div>
                  </div>

                  {/* PHOTO 2: Young Woman Mirror Selfie (Right) */}
                  <div
                    className="absolute right-4 top-14 w-[92px] h-[106px] bg-stone-100 border-[3px] border-stone-100 shadow-[0_4px_10px_rgba(0,0,0,0.6)] rotate-[5deg] flex flex-col p-1 z-10 transition-transform duration-300 hover:rotate-[2deg] hover:scale-105 group"
                  >
                    {/* Washi Tape */}
                    <div className="absolute -top-2.5 right-6 w-9 h-3.5 bg-stone-300/30 border border-stone-200/10 backdrop-blur-[1px] rotate-[-10deg] shadow-sm pointer-events-none" />
                    
                    <img
                      src="/images/image2.png"
                      alt="Mirror Selfie Her"
                      className="w-full h-[76px] object-cover grayscale brightness-[95%] sepia-[10%] rounded-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex items-center justify-center">
                      <span className="font-mono text-[7px] text-neutral-500 font-bold tracking-wider">RICHUU ❤️ '22</span>
                    </div>
                  </div>

                  {/* PHOTO 3: Hands Reaching/Touching (Bottom Center) */}
                  <div
                    className="absolute bottom-9 left-[98px] w-[88px] h-[98px] bg-stone-100 border-[3px] border-stone-100 shadow-[0_4px_10px_rgba(0,0,0,0.6)] rotate-[-1deg] flex flex-col p-1 z-20 transition-transform duration-300 hover:rotate-[2deg] hover:scale-105"
                  >
                    {/* Transparent Tape */}
                    <div className="absolute -top-2 left-6 w-8 h-3 bg-stone-200/40 border border-white/10 backdrop-blur-[0.5px] rotate-[3deg] shadow-sm pointer-events-none" />
                    
                    <img
                      src="/images/HANDS.jpeg"
                      alt="Hands Touching"
                      className="w-full h-[68px] object-cover brightness-[102%] saturate-[75%] rounded-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex items-center justify-center">
                      <span className="font-handwritten text-[9px] text-neutral-600 font-bold tracking-wider">FOREVER</span>
                    </div>
                  </div>

                  {/* Torn Note Left */}
                  <div
                    className="absolute left-2.5 bottom-12 w-[74px] h-[52px] bg-[#ece5da] border border-stone-300/30 shadow-[0_2px_6px_rgba(0,0,0,0.4)] rotate-[-12deg] p-1.5 flex items-center justify-center text-center select-none z-10 hover:scale-105 transition-transform"
                    style={{ borderRadius: '4px 8px 3px 6px' }}
                  >
                    <p className="font-handwritten text-[7.5px] text-stone-800 leading-tight font-semibold">
                      In a world full of people my eyes will always search for you ♥
                    </p>
                  </div>

                  {/* Torn Note Right */}
                  <div
                    className="absolute right-2.5 bottom-12 w-[74px] h-[52px] bg-[#ece5da] border border-stone-300/30 shadow-[0_2px_6px_rgba(0,0,0,0.4)] rotate-[10deg] p-1.5 flex items-center justify-center text-center select-none z-10 hover:scale-105 transition-transform"
                    style={{ borderRadius: '6px 3px 8px 4px' }}
                  >
                    <p className="font-handwritten text-[7.5px] text-stone-800 leading-tight font-semibold">
                      TOGETHER IS MY FAVORITE PLACE TO BE ♥
                    </p>
                  </div>

                  {/* Custom CSS Dried Baby's Breath Flower Sprigs */}
                  <DriedFlower className="absolute left-[88px] top-11 rotate-[-45deg] scale-75 z-10" />
                  <DriedFlower className="absolute right-[88px] top-11 rotate-[45deg] scale-75 z-10" />
                  <DriedFlower className="absolute left-[38px] bottom-28 rotate-[-95deg] scale-[0.65] z-10" />
                  <DriedFlower className="absolute right-[38px] bottom-28 rotate-[95deg] scale-[0.65] z-10" />

                  {/* Double Hearts Illustration */}
                  <div className="absolute bottom-4 left-[134px] flex items-center gap-1 opacity-40 select-none z-10 text-stone-300 text-xs rotate-[-10deg]">
                    <span>♡</span>
                    <span className="text-[10px] -translate-y-1">♡</span>
                  </div>
                </div>

                {/* 2. Cake Side Face (Creates the 3D cylinder thickness) */}
                <div
                  className="absolute w-[290px] h-[80px] rounded-b-full shadow-2xl"
                  style={{
                    background: 'linear-gradient(180deg, #1b1b1b 0%, #0d0d0d 100%)',
                    transform: 'translateY(105px) translateZ(0px)',
                    zIndex: 2,
                  }}
                >
                  {/* Glossy chocolate ganache highlights on the side */}
                  <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-b from-[#333]/20 to-transparent" />
                  <div className="absolute left-10 top-2 w-4 h-12 bg-white/5 blur-[2px] rounded-full" />
                  <div className="absolute right-16 top-3 w-3 h-8 bg-white/5 blur-[2px] rounded-full" />
                </div>

                {/* 3. Black Cake Stand Platter (Base support) */}
                <div
                  className="absolute w-[326px] h-[326px] rounded-full flex flex-col justify-end items-center"
                  style={{
                    background: 'radial-gradient(circle, #151515 0%, #080808 100%)',
                    border: '1px solid #1a1a1a',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.8), inset 0 2px 5px rgba(255,255,255,0.05)',
                    transform: 'translateY(10px) translateZ(-20px)',
                    zIndex: 1,
                  }}
                >
                  {/* Golden Elegant Rim Cursive Inscription */}
                  <div className="absolute bottom-[10px] w-full text-center select-none pointer-events-none z-20">
                    <span className="font-handwritten text-[11px] font-bold tracking-widest text-[#dfceb0]/90 block drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] animate-pulse">
                      Happy Birthday, My Love ♥ ♥
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* REAL-TIME MICROPHONE BAR / INSTRUCTIONS */}
            <AnimatePresence>
              {!allCandlesOut && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col items-center gap-4 mt-8 z-10"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="font-handwritten text-xl text-yellow-100 flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-300 animate-spin" />
                      Gently blow or whisper into your mic
                    </p>
                    <p className="text-[11px] text-neutral-400 max-w-xs text-center font-sans">
                      (Or simply tap each candle individually to blow them out!)
                    </p>
                  </div>

                  {micEnabled ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wider">
                        <Volume2 size={12} className="animate-pulse" />
                        Listening to your breath...
                      </div>
                      
                      {/* Smooth progress bar visualizing blowing intensity */}
                      <div className="w-52 h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-400 to-rose-500"
                          style={{ width: `${blowProgress * 100}%` }}
                          transition={{ type: 'spring', damping: 15 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        setMicEnabled(true);
                        await startListening();
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600/30 border border-rose-500/50 hover:bg-rose-600/50 text-rose-200 font-medium text-xs transition cursor-pointer"
                    >
                      <Mic size={12} />
                      Enable Microphone Blow
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CELEBRATION TYPEWRITER / WISH MESSAGES */}
            <AnimatePresence>
              {(flowStage === 'typewriter' || flowStage === 'finale') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="mt-8 text-center space-y-6 z-10 px-4"
                >
                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Animated Cinematic Typewriter Lines */}
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 1.2 }}
                      className="font-serif text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-rose-300 to-pink-300 tracking-wide"
                    >
                      Happy Birthday ❤️
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.0, duration: 1.2 }}
                      className="font-handwritten text-xl text-neutral-200"
                    >
                      Make a wish...
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.5, duration: 1.5 }}
                      className="text-xs md:text-sm text-neutral-400 font-light tracking-wide leading-relaxed font-serif italic"
                    >
                      I hope every single one comes true.
                    </motion.p>
                  </div>

                  {/* 5. FINALE surprise message & CONTINUE CTA */}
                  {flowStage === 'finale' && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="pt-6 border-t border-white/5 flex flex-col items-center gap-4"
                    >
                      <p className="text-xs text-amber-200 font-medium tracking-widest uppercase">
                        I have one more surprise...
                      </p>
                      <button
                        onClick={onBlowOut}
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 text-white font-semibold text-xs tracking-wider uppercase border border-white/10 hover:brightness-110 active:scale-95 transition cursor-pointer shadow-xl shadow-rose-600/20"
                      >
                        Continue <Heart size={12} className="fill-white" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MIC ACCESS DENIED POPUP (MODAL) */}
      <AnimatePresence>
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-3xl max-w-sm w-full relative text-center"
            >
              <button
                onClick={() => setShowErrorModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 mx-auto mb-4">
                <Mic size={20} />
              </div>

              <h3 className="font-serif text-lg font-bold text-neutral-100 mb-2">
                Microphone Needed
              </h3>
              
              <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                {errorMsg || "We need your microphone so you can blow out the candles with your breath. Alternatively, you can tap on each candle to blow them out."}
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={async () => {
                    setShowErrorModal(false);
                    setMicEnabled(true);
                    await startListening();
                  }}
                  className="px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 font-semibold text-xs tracking-wider uppercase transition cursor-pointer border border-white/5"
                >
                  Blow Out by Tapping Instead
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
