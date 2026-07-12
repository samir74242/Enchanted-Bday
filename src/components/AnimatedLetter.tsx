import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FastForward } from 'lucide-react';

interface AnimatedLetterProps {
  text: string;
  onComplete?: () => void;
}

export const AnimatedLetter: React.FC<AnimatedLetterProps> = ({ text, onComplete }) => {
  const [tokens, setTokens] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tokenize on mount or text change
  useEffect(() => {
    // Split by whitespace and keep the delimiters (spaces, newlines)
    const splitTokens = text.split(/(\s+)/).filter(t => t !== '');
    setTokens(splitTokens);
    setVisibleCount(0);
    setIsCompleted(false);
  }, [text]);

  // Handle the typewriter timing
  useEffect(() => {
    if (tokens.length === 0) return;

    if (visibleCount >= tokens.length) {
      if (!isCompleted) {
        setIsCompleted(true);
        if (onComplete) onComplete();
      }
      return;
    }

    const currentToken = tokens[visibleCount];
    
    // Determine the delay based on token type (punctuation, newlines, spaces)
    let delay = 35; // base delay of 35ms per token
    
    if (currentToken.includes('\n')) {
      delay = 450; // Pause longer for paragraph breaks
    } else if (/[.,\/#!$%\^&\*;:{}=\-_`~()?]/.test(currentToken)) {
      delay = 180; // Pause slightly for punctuation marks
    } else if (currentToken.trim() === '') {
      delay = 0; // Spaces are revealed immediately for a natural word-by-word flow
    }

    timerRef.current = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tokens, visibleCount, isCompleted, onComplete]);

  // Smooth auto-scroll as text expands
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      // Scroll to the bottom of the visible area
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleCount]);

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisibleCount(tokens.length);
    setIsCompleted(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[300px]">
      {/* Scrollable text container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto no-scrollbar pr-1 max-h-[360px] md:max-h-[400px]"
      >
        <div className="whitespace-pre-line text-gray-800 font-handwritten selection:bg-pink-100 selection:text-pink-700 text-lg md:text-xl leading-relaxed tracking-wide">
          {tokens.slice(0, visibleCount).map((token, idx) => {
            if (token.includes('\n')) {
              return <span key={idx}>{token}</span>;
            }
            if (token.trim() === '') {
              return <span key={idx}>{token}</span>;
            }
            return (
              <motion.span
                key={idx}
                initial={{ opacity: 0, filter: 'blur(2px)', y: 2 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="inline-block"
              >
                {token}
              </motion.span>
            );
          })}
          
          {/* Pulsing typewriter reading cursor */}
          {!isCompleted && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-1.5 h-4 bg-pink-500 ml-1 translate-y-0.5"
            />
          )}
        </div>
      </div>

      {/* Control panel at bottom */}
      {!isCompleted && (
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100 shrink-0">
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 font-serif text-[11px] font-medium tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
          >
            <FastForward size={11} />
            Skip typewriter effect
          </button>
        </div>
      )}
    </div>
  );
};
