import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Heart, 
  Music, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Coffee, 
  Compass, 
  Smile, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Gift, 
  Star, 
  Eye, 
  Check, 
  RotateCcw, 
  FileText, 
  Activity, 
  ArrowRight,
  Flame,
  Volume1,
  BookOpen,
  X
} from 'lucide-react';

import { AppConfig, FutureWish, GalleryMemory, TimelineChapter, TreasureClue } from './types';
import { defaultConfig } from './data/defaultConfig';
import { AmbientAudioSynth } from './components/AudioSynth';
import { ConfettiFireworks } from './components/ConfettiFireworks';
import { BloomingCanvas } from './components/BloomingCanvas';
import { ConstellationCanvas } from './components/ConstellationCanvas';
import { CakeSection } from './components/CakeSection';
import { AnimatedLetter } from './components/AnimatedLetter';
import { PersonalizationPanel } from './components/PersonalizationPanel';

export default function App() {
  // Load configuration from URL Hash (for sharing) -> then localStorage -> then fallback to defaultConfig
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#config=')) {
        const base64 = hash.replace('#config=', '');
        const jsonStr = decodeURIComponent(escape(atob(base64)));
        const parsed = JSON.parse(jsonStr);
        if (parsed.herName && parsed.specialDate) {
          // Save shared config to local storage too
          localStorage.setItem('birthday_story_config', jsonStr);
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse config from URL hash", e);
    }

    try {
      const saved = localStorage.getItem('birthday_story_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load config from localStorage", e);
    }

    return defaultConfig;
  });

  // Stage Management:
  // 0: Entry / Music Lock (Establishes AudioContext)
  // 1: Landing Experience (Two emotional sentences)
  // 2: Password Gate
  // 3: Cinematic Intro
  // 4: Interactive Timeline
  // 5: Museum of Memories
  // 6: Treasure Hunt Clues
  // 7: 100 Reasons Why
  // 8: Sealed Letter
  // 9: Voice Surprise (Close your eyes)
  // 10: Interactive Birthday Cake
  // 11: Constellation Wishes (Our Future)
  // 12: Final Secret (The End -> Wait -> Finale)
  const [stage, setStage] = useState<number>(0);
  
  // Transition state
  const [bloomingActive, setBloomingActive] = useState(false);

  // Client-side routing state ('main' or 'personalization')
  const [currentRoute, setCurrentRoute] = useState<'main' | 'personalization'>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/personalization' || hash === '#/personalization' || hash.startsWith('#/personalization') || hash.startsWith('#config=')) {
      // In case we have shared config hash, let's keep it main unless it's explicitly personalization hash
      if (hash.startsWith('#/personalization')) {
        return 'personalization';
      }
      return path === '/personalization' ? 'personalization' : 'main';
    }
    return 'main';
  });

  const navigate = (route: 'main' | 'personalization') => {
    const url = route === 'personalization' ? '/personalization' : '/';
    window.history.pushState({}, '', url);
    setCurrentRoute(route);
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/personalization' || hash === '#/personalization' || hash.startsWith('#/personalization')) {
        setCurrentRoute('personalization');
      } else {
        setCurrentRoute('main');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Audio Synthesizer Controls
  const synthRef = useRef<AmbientAudioSynth>(new AmbientAudioSynth());
  const [muted, setMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  // Stage 1 Landing state
  const [landingTextIdx, setLandingTextIdx] = useState(0);

  // Stage 2 Password Gate state
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  
  // Stage 4 Timeline state
  const [currentTimelineIdx, setCurrentTimelineIdx] = useState(0);

  // Stage 5 Memory Gallery state
  const [activeMemory, setActiveMemory] = useState<GalleryMemory | null>(null);
  const [playingVoiceNoteId, setPlayingVoiceNoteId] = useState<string | null>(null);

  // Stage 6 Clue hunt state
  const [solvedClues, setSolvedClues] = useState<Record<string, boolean>>({});
  const [clueInputs, setClueInputs] = useState<Record<string, string>>({});
  const [clueErrors, setClueErrors] = useState<Record<string, string>>({});

  // Stage 7 Reasons state
  const [reasonsRevealed, setReasonsRevealed] = useState<number>(0);
  const [currentReasonIdx, setCurrentReasonIdx] = useState<number>(0);
  const [reasonEffect, setReasonEffect] = useState(false);

  // Stage 8 Letter state
  const [letterUnfolded, setLetterUnfolded] = useState(false);

  // Stage 9 Voice Surprise state
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSubtitleIdx, setVoiceSubtitleIdx] = useState(0);

  // Stage 10 Birthday Cake state
  const [cakeBlown, setCakeBlown] = useState(false);

  // Stage 11 Constellation wishes
  const [selectedWish, setSelectedWish] = useState<FutureWish | null>(null);

  // Stage 12 Finale states
  const [showFinaleWait, setShowFinaleWait] = useState(true);
  const [finaleTextState, setFinaleTextState] = useState(0); // 0: "The End", 1: "Wait...", 2: "I still have...", 3: Final Photo & Love msg

  // Core background particle effects mapper
  const [activeEffects, setActiveEffects] = useState<('petals' | 'hearts' | 'stars' | 'fireworks' | 'lanterns')[]>(['stars']);

  // Handle background audio state (procedural synth vs custom songUrl)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const songUrl = config.songUrl ? config.songUrl.trim() : "";
    
    if (songUrl) {
      // If there is a custom MP3 URL, stop the procedural synthesizer
      synthRef.current.stop();

      // Normalize slashes (converts backslashes to forward slashes for relative URLs)
      const normalizedUrl = songUrl.replace(/\\/g, '/');

      // Create or update the HTMLAudioElement
      let player = audioRef.current;
      if (!player) {
        player = new Audio(normalizedUrl);
        player.loop = true;
        audioRef.current = player;
      } else {
        // If the src has changed, update it
        const resolvedSrc = new URL(normalizedUrl, window.location.href).href;
        if (player.src !== resolvedSrc) {
          player.pause();
          player.src = normalizedUrl;
        }
      }

      // Sync play/pause with the overall audio controls
      if (audioStarted && !muted) {
        player.play().catch((err) => {
          console.warn("Failed to play custom background audio:", err);
        });
      } else {
        player.pause();
      }
    } else {
      // If songUrl is empty, stop the custom audio player if it exists
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Use the procedural synthesizer instead
      if (audioStarted && !muted) {
        synthRef.current.start();
      } else {
        synthRef.current.stop();
      }
    }
  }, [audioStarted, muted, config.songUrl]);

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Adjust particle effects based on active stage
  useEffect(() => {
    switch (stage) {
      case 0:
        setActiveEffects(['stars']);
        break;
      case 1:
        setActiveEffects(['stars', 'hearts']);
        break;
      case 2:
        setActiveEffects(['stars', 'petals']);
        break;
      case 3:
        setActiveEffects(['stars']);
        break;
      case 4:
        setActiveEffects(['stars', 'petals']);
        break;
      case 5:
        setActiveEffects(['stars', 'lanterns']);
        break;
      case 6:
        setActiveEffects(['stars', 'petals']);
        break;
      case 7:
        setActiveEffects(['stars', 'hearts']);
        break;
      case 8:
        setActiveEffects(['stars', 'petals']);
        break;
      case 9:
        setActiveEffects(['stars', 'lanterns']);
        break;
      case 10:
        setActiveEffects(cakeBlown ? ['stars', 'fireworks', 'lanterns', 'hearts'] : ['stars', 'petals']);
        break;
      case 11:
        setActiveEffects(['stars', 'lanterns']);
        break;
      case 12:
        setActiveEffects(finaleTextState >= 3 ? ['stars', 'fireworks', 'lanterns', 'hearts'] : ['stars']);
        break;
      default:
        setActiveEffects(['stars']);
    }
  }, [stage, cakeBlown, finaleTextState]);

  // Stage 1 Landing Text Sequence Timer
  useEffect(() => {
    if (stage === 1) {
      const timer = setTimeout(() => {
        setLandingTextIdx(1);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Helper for rendering Lucide icons from strings
  const renderIcon = (name: string, size = 20, className = "") => {
    const map: Record<string, any> = {
      Coffee: Coffee,
      Compass: Compass,
      Smile: Smile,
      Sparkles: Sparkles,
      Star: Star,
      Heart: Heart,
    };
    const IconComp = map[name] || Sparkles;
    return <IconComp size={size} className={className} />;
  };

  // Stage 2 Password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedInput = passwordInput.trim().toLowerCase();
    const cleanedAnswer = config.specialDate.trim().toLowerCase();

    if (cleanedInput === cleanedAnswer || cleanedInput === "happybirthday") {
      setPasswordErrorMsg('');
      // Trigger the spectacular blooming canvas transition!
      setBloomingActive(true);
    } else {
      const messages = [
        "Aww, not quite! Try the day we first became 'us'! ❤️",
        "Almost! Hint: Think of our special anniversary date. 🥰",
        "Nope, but I still adore you! Enter our romantic date in DD/MM/YYYY format! 🌹",
        "Try looking at the hint below, my princess! Hint: 'Our special date'..."
      ];
      setPasswordErrorMsg(messages[Math.floor(Math.random() * messages.length)]);
      setPasswordInput('');
    }
  };

  const handleBloomComplete = () => {
    setBloomingActive(false);
    setStage(3); // Go to Cinematic Intro
  };

  // Clue solving checker
  const handleSolveClue = (clueId: string, correctAnswer: string) => {
    const input = clueInputs[clueId] || "";
    const cleanedInput = input.trim().toLowerCase();
    
    // Support multiple accepted answers separated by "|"
    const answers = correctAnswer.split('|').map(a => a.trim().toLowerCase());
    const isCorrect = answers.includes(cleanedInput);

    if (isCorrect) {
      setSolvedClues(prev => ({ ...prev, [clueId]: true }));
      setClueErrors(prev => ({ ...prev, [clueId]: "" }));
    } else {
      const mockFails = [
        "Hmm, that doesn't sound right! Think harder, honey! 💕",
        "Ah, so close! Review the Hint carefully. 😉",
        "Not yet! Try another guess!"
      ];
      setClueErrors(prev => ({ ...prev, [clueId]: mockFails[Math.floor(Math.random() * mockFails.length)] }));
      setClueInputs(prev => ({ ...prev, [clueId]: "" }));
    }
  };

  // Reasons reveal transition trigger
  const handleNextReason = () => {
    if (currentReasonIdx < config.reasons.length - 1) {
      setReasonEffect(true);
      setTimeout(() => {
        setCurrentReasonIdx(p => p + 1);
        setReasonsRevealed(p => Math.max(p, currentReasonIdx + 2));
        setReasonEffect(false);
      }, 300);
    }
  };

  const handlePrevReason = () => {
    if (currentReasonIdx > 0) {
      setReasonEffect(true);
      setTimeout(() => {
        setCurrentReasonIdx(p => p - 1);
        setReasonEffect(false);
      }, 300);
    }
  };

  // Voice surprise captions sequence timing
  useEffect(() => {
    let timer: any;
    if (stage === 9 && voiceActive) {
      if (voiceSubtitleIdx < config.gallery.length) {
        timer = setTimeout(() => {
          setVoiceSubtitleIdx(prev => prev + 1);
        }, 5000); // 5s per slide subtitle
      } else {
        // Finished voice message
        setVoiceActive(false);
      }
    }
    return () => clearTimeout(timer);
  }, [stage, voiceActive, voiceSubtitleIdx]);

  // Stage 12 Cinematic Finale Timings
  useEffect(() => {
    if (stage === 12) {
      setShowFinaleWait(true);
      setFinaleTextState(0); // "The End"

      // 1. After 4s: Show "Wait..."
      const t1 = setTimeout(() => {
        setFinaleTextState(1);
      }, 4000);

      // 2. After 7s: Show "I still have one more thing..."
      const t2 = setTimeout(() => {
        setFinaleTextState(2);
      }, 7500);

      // 3. After 11s: Show Final gorgeous Photo and Card message
      const t3 = setTimeout(() => {
        setFinaleTextState(3);
        setShowFinaleWait(false);
      }, 11000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [stage]);

  // Handle configuration updates from Personalizer Panel
  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('birthday_story_config', JSON.stringify(newConfig));
  };

  const handleResetConfig = () => {
    localStorage.removeItem('birthday_story_config');
    setConfig(defaultConfig);
    // Remove custom hash from URL to fully reset default story
    window.location.hash = '';
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1b0513] via-[#0b0208] to-[#040003] text-[#FFFDF8] font-sans overflow-x-hidden flex flex-col justify-between selection:bg-pink-500/30 selection:text-pink-200">
      
      {/* Absolute fullscreen decorative particle effects canvas */}
      <ConfettiFireworks effects={activeEffects} />

      {/* Spectacular Canvas that animates blooming floral vines on password success */}
      <BloomingCanvas active={bloomingActive} onComplete={handleBloomComplete} />

      {currentRoute === 'personalization' ? (
        <div className="flex-grow flex flex-col items-center justify-center py-10 px-4 z-10 relative">
          <div className="text-center mb-6">
            <h1 className="font-serif text-3xl font-bold text-yellow-100 tracking-wide flex items-center justify-center gap-2">
              <Heart className="text-pink-500 fill-pink-500 animate-pulse" size={24} />
              Personalization Studio
            </h1>
            <p className="text-xs text-yellow-200/60 max-w-md mt-1">
              Customize all sections of the surprise e-card, then export or copy the share link to send to your partner! ❤️
            </p>
          </div>
          <PersonalizationPanel
            config={config}
            onSave={handleSaveConfig}
            onReset={handleResetConfig}
            isFullPage={true}
            onBack={() => navigate('main')}
          />
        </div>
      ) : (
        <>
          {/* Luxury sound / music controller (Floating at top-right for elegant access) */}
          {audioStarted && stage > 0 && (
            <div className="absolute top-6 right-6 z-40 flex items-center gap-2">
              <button
                onClick={() => setMuted(!muted)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glassmorphism text-xs font-semibold text-yellow-100 border border-yellow-500/10 hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-md"
                id="mute-music-toggle"
              >
                {muted ? <VolumeX size={14} className="text-pink-400" /> : <Volume2 size={14} className="text-yellow-400 animate-pulse" />}
                <span>{muted ? "Muted" : "Music Loop"}</span>
              </button>
            </div>
          )}

          {/* MAIN STORYBOOK SCREEN */}
          <main className="flex-1 flex flex-col items-center justify-center relative w-full px-4 py-8 md:py-16">
        
        <AnimatePresence mode="wait">
          
          {/* STAGE 0: RECEPTIVE SPLASH ENTRY */}
          {stage === 0 && (
            <motion.div
              key="stage-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-md p-8 rounded-3xl glassmorphism-dark border border-pink-500/10 shadow-2xl relative z-10 flex flex-col items-center"
              id="stage-splash-entry"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500/10 to-pink-500/10 flex items-center justify-center mb-6 border border-pink-500/20 animate-pulse">
                <Heart className="text-pink-400 fill-pink-400" size={32} />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-yellow-100 font-bold mb-4 tracking-wide">
                A Journal of Us
              </h1>
              <p className="text-sm text-yellow-100/75 mb-8 leading-relaxed font-sans font-light">
                A handcrafted collection of our sweetest moments, written in the stars and saved in our hearts. Please turn your volume on to hear our story's melody.
              </p>
              <button
                onClick={() => {
                  setAudioStarted(true);
                  setStage(1); // Advance to Landing
                }}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-tr from-yellow-500 to-pink-500 text-white font-semibold text-base transition-all shadow-xl shadow-pink-500/10 active:scale-95 cursor-pointer hover:brightness-110 border border-white/20"
                id="enter-button"
              >
                <Music size={18} className="animate-bounce" />
                Step Inside Our World 🌹
              </button>
            </motion.div>
          )}

          {/* STAGE 1: LANDING EXPERIENTIAL TEXT */}
          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-center max-w-2xl px-6 relative z-10 select-none flex flex-col items-center justify-center"
              id="stage-landing-experience"
            >
              <AnimatePresence mode="wait">
                {landingTextIdx === 0 ? (
                  <motion.p
                    key="landing-txt-1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 1.5 }}
                    className="font-serif text-xl md:text-3xl italic leading-relaxed text-pink-100/90 font-light"
                  >
                    "I gathered every starlight memory of us, just to make you smile today."
                  </motion.p>
                ) : (
                  <motion.div
                    key="landing-txt-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1.5 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-wide text-yellow-100">
                      Happy Birthday, {config.herName} ❤️
                    </h2>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      onClick={() => setStage(2)}
                      className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full glassmorphism text-xs font-semibold uppercase tracking-widest text-yellow-100 cursor-pointer border border-yellow-500/20 active:scale-95 hover:bg-white/5 transition-all"
                    >
                      Begin Our Walk <ChevronRight size={14} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STAGE 2: THE PASSWORD GATE */}
          {stage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-md p-8 rounded-3xl glassmorphism border border-pink-900/20 text-center relative z-10 shadow-2xl"
              id="stage-password-gate"
            >
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-6 mx-auto border border-pink-500/20">
                <Lock className="text-pink-400 animate-pulse" size={24} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-yellow-100 font-bold mb-2 tracking-wide">
                Our Secret Key
              </h2>
              <p className="text-xs text-yellow-100/70 mb-6 font-light leading-relaxed">
                To enter this secret archive of us, whisper our special date below.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Our special date..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#1b0513]/80 border border-pink-900/40 focus:border-pink-500/60 rounded-xl px-4 py-3 text-sm outline-none text-center font-mono tracking-widest placeholder-pink-900/40 transition"
                />
                
                <AnimatePresence>
                  {passwordErrorMsg && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-pink-300 font-medium animate-pulse"
                    >
                      {passwordErrorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="pt-2">
                  <span className="text-[10px] text-pink-400/50 uppercase tracking-widest font-mono">
                    Do you remember the date that started it all?
                  </span>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono italic">
                    (Hint: {config.specialDate})
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-yellow-500 to-pink-500 text-white font-semibold text-sm shadow-xl active:scale-95 hover:brightness-110 transition cursor-pointer font-serif"
                >
                  Step Into Our Memories 🌹
                </button>
              </form>
            </motion.div>
          )}

          {/* STAGE 3: CINEMATIC INTRODUCTION */}
          {stage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-center max-w-2xl px-6 relative z-10 space-y-8 select-none flex flex-col items-center justify-center"
              id="stage-cinematic-intro"
            >
              <div className="space-y-4 font-serif text-xl md:text-3xl italic leading-relaxed text-yellow-100/90 font-light">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1.5 }}
                >
                  "Every love story has a beginning..."
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3, duration: 1.5 }}
                >
                  "Ours became my favourite."
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 5.5, duration: 1.2 }}
                  className="text-pink-300"
                >
                  "And today..."
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 7.5, duration: 1.5 }}
                  className="text-3xl md:text-5xl font-bold font-serif text-yellow-100 tracking-wide block pt-4"
                >
                  "It's your birthday."
                </motion.p>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 10, duration: 1 }}
                onClick={() => setStage(4)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-tr from-yellow-500/30 to-pink-500/30 text-yellow-100 text-xs font-semibold uppercase tracking-widest border border-yellow-500/20 cursor-pointer active:scale-95 hover:bg-white/5 transition-all"
              >
                Walk Down Memory Lane <ArrowRight size={14} className="animate-pulse" />
              </motion.button>
            </motion.div>
          )}

          {/* STAGE 4: INTERACTIVE TIMELINE */}
          {stage === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-3xl flex flex-col items-center relative z-10"
              id="stage-interactive-timeline"
            >
              <div className="text-center mb-8">
                <p className="font-handwritten text-2xl text-pink-300">
                  Chapter {currentTimelineIdx + 1} of {config.timeline.length}
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-yellow-100 font-bold mt-1 tracking-wide">
                  Our Chapters of Love
                </h2>
              </div>

              {/* Memory Story Book Layout */}
              <div className="grid md:grid-cols-12 gap-6 w-full items-center min-h-[380px] p-6 rounded-3xl glassmorphism border border-yellow-500/15 shadow-xl relative overflow-hidden">
                
                {/* Decorative glowing lines */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Left side: Polaroid style frame image */}
                <div className="md:col-span-5 flex justify-center">
                  <motion.div
                    key={currentTimelineIdx}
                    initial={{ opacity: 0, rotate: -4, scale: 0.9 }}
                    animate={{ opacity: 1, rotate: 2, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white text-gray-800 p-3 pb-6 rounded-sm shadow-2xl max-w-[240px] border border-gray-200"
                  >
                    <img
                      src={config.timeline[currentTimelineIdx].image}
                      alt={config.timeline[currentTimelineIdx].title}
                      referrerPolicy="no-referrer"
                      className="w-full h-44 object-cover rounded-sm mb-3 bg-gray-100"
                    />
                    <div className="text-center font-handwritten text-lg font-bold leading-none select-none text-gray-700">
                      {config.timeline[currentTimelineIdx].date}
                    </div>
                  </motion.div>
                </div>

                {/* Right side: Detailed narrative with icons */}
                <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
                  <motion.div
                    key={`story-${currentTimelineIdx}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-yellow-400">
                      {renderIcon(config.timeline[currentTimelineIdx].icon, 18, "animate-pulse")}
                      <span className="text-xs font-mono tracking-wider text-yellow-400/80 uppercase font-semibold">
                        {config.timeline[currentTimelineIdx].date}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl md:text-2xl text-yellow-100 font-semibold tracking-wide">
                      {config.timeline[currentTimelineIdx].title}
                    </h3>

                    <p className="text-sm text-yellow-100/70 leading-relaxed font-sans font-light">
                      {config.timeline[currentTimelineIdx].story}
                    </p>
                  </motion.div>

                  {/* Internal pagination triggers */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <button
                      onClick={() => setCurrentTimelineIdx(p => Math.max(0, p - 1))}
                      disabled={currentTimelineIdx === 0}
                      className="p-2 rounded-full glassmorphism text-yellow-100 hover:bg-white/10 active:scale-90 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex gap-1.5">
                      {config.timeline.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentTimelineIdx ? 'w-5 bg-yellow-400' : 'w-1.5 bg-yellow-400/20'
                          }`}
                        />
                      ))}
                    </div>

                    {currentTimelineIdx < config.timeline.length - 1 ? (
                      <button
                        onClick={() => setCurrentTimelineIdx(p => p + 1)}
                        className="p-2 rounded-full glassmorphism text-yellow-100 hover:bg-white/10 active:scale-90 transition cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setStage(6)}
                        className="flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-gradient-to-tr from-yellow-500/20 to-pink-500/20 text-yellow-200 text-xs font-bold uppercase tracking-wider border border-yellow-500/20 active:scale-95 transition cursor-pointer font-serif"
                      >
                        Unlock Our Secret Clues <ChevronRight size={14} />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </motion.div>
          )}



          {/* STAGE 6: THE TREASURE HUNT */}
          {stage === 6 && (
            <motion.div
              key="stage-6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-3xl flex flex-col items-center relative z-10"
              id="stage-treasure-hunt"
            >
              <div className="text-center mb-8">
                <p className="font-handwritten text-2xl text-pink-300">
                  Do You Remember?
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-yellow-100 font-bold mt-1 tracking-wide">
                  Our Sweet Secrets
                </h2>
                <p className="text-xs text-yellow-100/70 mt-2 max-w-sm mx-auto">
                  Three little questions that only we know the answers to. Unravel them to reveal a hidden memory from our past.
                </p>
              </div>

              {/* Clues Accordion Grid */}
              <div className="grid gap-6 w-full">
                {config.clues.map((clue, idx) => {
                  const isSolved = solvedClues[clue.id];
                  return (
                    <div
                      key={clue.id}
                      className={`p-6 rounded-2xl glassmorphism border transition-all duration-300 ${
                        isSolved ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-yellow-500/10'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <span className="font-handwritten text-lg text-yellow-400 block">
                            Secret Riddle {idx + 1}
                          </span>
                          <h3 className="font-serif text-lg text-yellow-100 font-semibold tracking-wide">
                            {clue.title}
                          </h3>
                          <p className="text-xs text-yellow-100/70 font-light leading-relaxed">
                            {clue.clue}
                          </p>
                        </div>

                        {/* Unlocked Clue Secret View */}
                        {isSolved ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col md:flex-row items-center gap-4 bg-[#081229]/60 p-3 rounded-xl border border-emerald-500/20 md:max-w-sm shrink-0"
                          >
                            <img
                              src={clue.secretImage}
                              alt="Secret"
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 object-cover rounded-md shadow-md border border-white/10 shrink-0"
                            />
                            <div className="text-center md:text-left">
                              <span className="font-handwritten text-base text-pink-300 block">A beautiful memory unlocked... ❤️</span>
                              <p className="text-[11px] text-yellow-100/90 italic mt-0.5 font-sans">
                                "{clue.secretMessage}"
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          /* Answer Input Form */
                          <div className="flex flex-col gap-2 shrink-0 md:w-64">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="Your answer..."
                                value={clueInputs[clue.id] || ""}
                                onChange={(e) => setClueInputs(prev => ({ ...prev, [clue.id]: e.target.value }))}
                                className="flex-1 bg-[#081229]/80 border border-gray-800 focus:border-pink-500/50 rounded-lg px-2.5 py-1.5 text-xs outline-none text-center"
                              />
                              <button
                                onClick={() => handleSolveClue(clue.id, clue.answer)}
                                className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium active:scale-95 transition cursor-pointer font-serif"
                              >
                                Whisper
                              </button>
                            </div>
                            
                            {clueErrors[clue.id] && (
                              <p className="text-[10px] text-pink-300 font-medium text-center">
                                {clueErrors[clue.id]}
                              </p>
                            )}

                            <span className="text-[9px] text-yellow-500/30 text-center font-mono">
                              Hint: {clue.hint}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next navigation triggers only if all 3 are solved */}
              <div className="mt-12 flex flex-col items-center gap-2">
                {Object.keys(solvedClues).length < config.clues.length ? (
                  <p className="text-xs text-pink-300/85 italic animate-pulse font-serif">
                    Answer our three little secrets to proceed... ❤️
                  </p>
                ) : (
                  <button
                    onClick={() => setStage(7)}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-tr from-yellow-500 to-pink-500 text-white font-semibold text-sm shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer font-serif"
                  >
                    Read My Heart's Reasons <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STAGE 7: "100 REASONS WHY I LOVE YOU" */}
          {stage === 7 && (
            <motion.div
              key="stage-7"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-xl flex flex-col items-center relative z-10"
              id="stage-reasons-deck"
            >
              <div className="text-center mb-8">
                <p className="font-handwritten text-2xl text-pink-300">
                  My Heart's Confession
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-yellow-100 font-bold mt-1 tracking-wide">
                  Reasons I Love You
                </h2>
                <p className="text-xs text-yellow-100/70 mt-2 max-w-sm mx-auto">
                  Just a few of the countless little reasons why you hold my heart, and why my days are brighter with you.
                </p>
              </div>

              {/* Glowing Interactive Reason Card Stack */}
              <div className="w-full min-h-[220px] p-6 md:p-8 rounded-3xl glassmorphism border border-yellow-500/15 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                
                {/* Heart watermarks backgrounds */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none">
                  <Heart size={200} className="text-pink-500" />
                </div>

                <div className="space-y-4 text-center">
                  <p className="font-handwritten text-xl text-yellow-400 block">
                    Reason {currentReasonIdx + 1} of {config.reasons.length}
                  </p>
                  
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentReasonIdx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="font-serif text-lg md:text-2xl text-pink-100 leading-relaxed font-light min-h-[90px]"
                    >
                      "{config.reasons[currentReasonIdx]}"
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Card controls */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                  <button
                    onClick={handlePrevReason}
                    disabled={currentReasonIdx === 0}
                    className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-20"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="font-handwritten text-base text-gray-400">
                    {reasonsRevealed} / {config.reasons.length} whispered
                  </div>

                  {currentReasonIdx < config.reasons.length - 1 ? (
                    <button
                      onClick={handleNextReason}
                      className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>
                  ) : (
                    <div className="font-handwritten text-lg text-yellow-400 animate-pulse">
                      Infinity ❤️
                    </div>
                  )}
                </div>

              </div>

              {/* After the final reason is reached */}
              <AnimatePresence>
                {currentReasonIdx === config.reasons.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-center mt-6 space-y-4"
                  >
                    <p className="font-serif text-sm md:text-base text-yellow-100/80 italic font-light">
                      "I stopped counting because infinity doesn't have a number."
                    </p>
                    <button
                      onClick={() => setStage(8)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-tr from-yellow-500 to-pink-500 text-white font-semibold text-sm shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer border border-white/15 font-serif"
                    >
                      Open My Letter to You ✉️
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STAGE 8: THE WAX SEALED ENVELOPE / LOVE LETTER */}
          {stage === 8 && (
            <motion.div
              key="stage-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-2xl flex flex-col items-center relative z-10"
              id="stage-love-letter"
            >
              <div className="text-center mb-8">
                <p className="font-handwritten text-2xl text-pink-300">
                  From Me, to You
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-yellow-100 font-bold mt-1 tracking-wide">
                  A Heartfelt Letter
                </h2>
              </div>

              <div className="w-full flex items-center justify-center overflow-hidden py-4">
                {!letterUnfolded ? (
                  /* Sealed Envelope View */
                  <div className="scale-90 sm:scale-100 transition-transform origin-center">
                    <motion.div
                      whileHover={{ scale: 1.02, rotate: -0.5 }}
                      onClick={() => setLetterUnfolded(true)}
                      className="w-80 h-52 bg-amber-50 rounded-lg shadow-2xl relative border-2 border-amber-100 flex items-center justify-center cursor-pointer select-none group"
                    >
                      {/* Diagonal flap lines of envelope */}
                      <div className="absolute inset-0 border-t-[100px] border-t-amber-100/80 border-x-[160px] border-x-transparent border-b-[108px] border-b-transparent top-0" />
                      <div className="absolute inset-0 border-b-[108px] border-b-amber-200/90 border-x-[160px] border-x-transparent top-0 rounded-b-lg" />
                      
                      {/* The beautiful Red Wax Stamp seal */}
                      <div className="relative z-10 w-16 h-16 rounded-full bg-red-700 shadow-xl border border-red-800 flex items-center justify-center animate-pulse group-hover:scale-110 transition duration-300">
                        <Heart className="text-pink-100 fill-pink-100" size={20} />
                        <div className="absolute inset-1 rounded-full border border-dashed border-red-600/30" />
                      </div>

                      <div className="absolute bottom-4 text-center w-full text-amber-900/70 font-serif text-[11px] font-medium tracking-widest">
                        Click seal to open 🌹
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  /* Unfolded handwritten love letter paper roll */
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-[#FFFDF8] text-gray-800 p-6 md:p-10 rounded-2xl shadow-2xl border border-yellow-500/10 relative max-h-[500px] overflow-y-auto no-scrollbar font-handwritten text-lg md:text-xl leading-relaxed"
                  >
                    {/* Elegant paper watermarks */}
                    <div className="absolute top-4 right-4 text-amber-800/15">
                      <Heart size={80} />
                    </div>

                    {/* Word-by-word typewriter and scroll animated letter */}
                    <AnimatedLetter text={config.letterText} />

                    {/* Navigation trigger below letter content */}
                    <div className="mt-10 pt-6 border-t border-gray-100 text-center flex flex-col items-center gap-3">
                      <span className="font-handwritten text-lg text-gray-500">
                        Thank you for reading my heart.
                      </span>
                      <button
                        onClick={() => setStage(9)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs font-serif tracking-wide transition cursor-pointer shadow-md"
                      >
                        Hear my spoken surprise... <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STAGE 9: VOICE SURPRISE ("CLOSE YOUR EYES") */}
          {stage === 9 && (
            <motion.div
              key="stage-9"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="w-full max-w-2xl text-center px-4 relative z-10"
              id="stage-voice-surprise"
            >
              {!voiceActive ? (
                /* Starter panel instruction */
                 <div className="p-8 rounded-3xl glassmorphism-dark border border-pink-950/20 max-w-md mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto border border-pink-500/10">
                    <Volume1 className="text-pink-400" size={28} />
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl text-yellow-100 font-bold tracking-wide">
                    A Whisper in the Wind
                  </h2>
                  <p className="text-xs text-yellow-100/70 leading-relaxed font-light">
                    I have saved some spoken words just for you. When you are ready, turn your sound up, find a quiet space, close your eyes, and listen.
                  </p>
                  <button
                    onClick={() => {
                      setVoiceActive(true);
                      setVoiceSubtitleIdx(0);
                    }}
                    className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-sm shadow-xl active:scale-95 transition cursor-pointer font-serif"
                  >
                    Listen with your heart 🎧
                  </button>
                </div>
              ) : (
                /* Active Cinema dark screen with fading subtitles and background memories */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-gradient-to-b from-[#160410] via-[#090207] to-[#020002] z-50 flex flex-col items-center justify-center p-6 space-y-8 select-none"
                >
                  {/* Subtle, beautiful starry sky is fully active here */}
                  <ConfettiFireworks effects={['stars', 'lanterns']} />

                  {/* Fading background photos matching the voice notes */}
                  <div className="absolute inset-0 w-full h-full pointer-events-none opacity-10 flex items-center justify-center">
                    {config.gallery[voiceSubtitleIdx] && (
                      <motion.img
                        key={voiceSubtitleIdx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 0.15, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        src={config.gallery[voiceSubtitleIdx].image}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Elegant glowing soundwave pulse */}
                  <div className="relative w-24 h-24 flex items-center justify-center z-10">
                    <div className="absolute inset-0 rounded-full bg-pink-500/10 border border-pink-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-pink-500/20 border border-pink-500/30 animate-pulse" />
                    <Heart size={32} className="text-pink-400 fill-pink-400 relative z-10" />
                  </div>

                  {/* Dynamic Subtitle captions fading in/out */}
                  <div className="max-w-xl text-center min-h-[100px] flex items-center justify-center z-10 px-4">
                    <AnimatePresence mode="wait">
                      {config.gallery[voiceSubtitleIdx] ? (
                        <motion.p
                          key={voiceSubtitleIdx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.8 }}
                          className="font-serif text-lg md:text-2xl text-pink-200 italic font-light leading-relaxed"
                        >
                          "{config.gallery[voiceSubtitleIdx].voiceText}"
                        </motion.p>
                      ) : (
                        <motion.p
                          key="end-voice"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-serif text-base text-gray-400 italic"
                        >
                          My heart is always with you...
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2 z-10">
                    {config.gallery.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all duration-1000 ${
                          idx === voiceSubtitleIdx ? 'w-6 bg-pink-500' : 'w-1.5 bg-pink-500/20'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setVoiceActive(false);
                      setStage(10); // Advance to Cake
                    }}
                    className="z-10 text-sm text-yellow-200/60 hover:text-yellow-200 underline cursor-pointer font-handwritten"
                  >
                    To your birthday cake... 🍰
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STAGE 10: INTERACTIVE BIRTHDAY CAKE */}
          {stage === 10 && (
            <motion.div
              key="stage-10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-2xl flex flex-col items-center relative z-10"
              id="stage-birthday-cake"
            >
              <CakeSection
                herName={config.herName}
                onBlowOut={() => {
                  setCakeBlown(true);
                  // Play a celebratory synthesized tone loop!
                  setTimeout(() => {
                    // Soft delay, then prompt next stage
                  }, 1000);
                }}
              />

              {cakeBlown && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-6 space-y-4 z-10"
                >
                  <p className="font-serif text-xs md:text-sm text-yellow-100/70 italic max-w-sm mx-auto leading-relaxed">
                    "Confetti floats, fires spark, stars fall... and my biggest dream is simply to watch your beautiful journey expand."
                  </p>
                  <button
                    onClick={() => setStage(11)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-tr from-yellow-500 to-pink-500 text-white font-semibold text-sm shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer border border-white/15"
                  >
                    Gaze into Our Future Constellations <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STAGE 11: WISHES FROM THE FUTURE (CONSTELLATION CANVAS) */}
          {stage === 11 && (
            <motion.div
              key="stage-11"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-4xl flex flex-col items-center relative z-10"
              id="stage-future-wishes"
            >
              <div className="text-center mb-8">
                <p className="font-handwritten text-2xl text-pink-300">
                  Written in the Stars
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-yellow-100 font-bold mt-1 tracking-wide">
                  Our Future Constellations
                </h2>
                <p className="text-xs text-yellow-100/60 mt-2 max-w-sm mx-auto">
                  The stars hold all our tomorrows. Tap the pulsing lights in the night sky to connect our constellation paths and reveal our dreams together.
                </p>
              </div>

              {/* Interactive map split block layout */}
              <div className="grid md:grid-cols-12 gap-8 w-full items-center">
                
                {/* Left side: Constellation map */}
                <div className="md:col-span-6 flex items-center justify-center">
                  <ConstellationCanvas
                    wishes={config.futureWishes}
                    onSelectWish={(wish) => setSelectedWish(wish)}
                  />
                </div>

                {/* Right side: Star wish detail description */}
                <div className="md:col-span-6 flex flex-col justify-center min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {selectedWish ? (
                      <motion.div
                        key={selectedWish.id}
                        initial={{ opacity: 0, x: 25 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -25 }}
                        transition={{ duration: 0.4 }}
                        className="p-6 rounded-2xl glassmorphism border border-yellow-500/15 space-y-4 shadow-xl"
                      >
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Star size={16} className="animate-spin-[duration:12s] fill-yellow-400" />
                          <span className="font-handwritten text-lg text-yellow-400">
                            Our {selectedWish.starName} Star
                          </span>
                        </div>

                        <h3 className="font-serif text-xl md:text-2xl text-yellow-100 font-bold tracking-wide">
                          {selectedWish.title}
                        </h3>

                        <p className="text-sm text-yellow-100/70 font-light leading-relaxed font-sans">
                          {selectedWish.description}
                        </p>

                        <div className="font-handwritten text-base text-pink-400/80 capitalize">
                          Constellation: The {selectedWish.constellationShape} shape
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-6 text-center text-sm text-pink-300/40 italic font-handwritten">
                        Tap on a glowing star in our night sky...
                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setStage(12)}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-tr from-yellow-500 to-pink-500 text-white font-semibold text-sm shadow-xl hover:brightness-110 active:scale-95 transition cursor-pointer border border-white/15 font-serif"
                >
                  Our Eternal Promise <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 12: FINAL MOVIE SECRET */}
          {stage === 12 && (
            <motion.div
              key="stage-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="w-full max-w-2xl text-center px-4 relative z-10 flex flex-col items-center justify-center min-h-[400px] select-none"
              id="stage-cinematic-finale"
            >
              {showFinaleWait ? (
                /* Dramatic sequentially delayed movie titles before final photo reveal */
                <div className="space-y-4 font-serif text-xl md:text-3xl italic leading-relaxed font-light text-yellow-100/95">
                  <AnimatePresence mode="wait">
                    {finaleTextState === 0 && (
                      <motion.p
                        key="end-txt-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="text-gray-400 text-sm uppercase tracking-[12px]"
                      >
                        The End
                      </motion.p>
                    )}
                    {finaleTextState === 1 && (
                      <motion.p
                        key="end-txt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                      >
                        "Wait..."
                      </motion.p>
                    )}
                    {finaleTextState === 2 && (
                      <motion.p
                        key="end-txt-2"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="text-pink-300"
                      >
                        "I still have one more thing."
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* The Final Gorgeous Photo Frame & Heart-Melting Birthday Message */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5 }}
                  className="space-y-8 flex flex-col items-center"
                >
                  {/* Polaroid favorite photo */}
                  <div className="bg-white text-gray-800 p-4 pb-8 rounded shadow-2xl max-w-[280px] border border-gray-200 rotate-2 hover:rotate-0 transition duration-500">
                    <img
                      src={config.timeline[0].image} // Favorite photo placeholder
                      alt="Favorite Snapshot"
                      referrerPolicy="no-referrer"
                      className="w-full h-52 object-cover rounded-sm mb-4 bg-gray-50"
                    />
                    <div className="font-handwritten text-xl text-center font-bold text-pink-600">
                      Happy Birthday ❤️
                    </div>
                  </div>

                  {/* Poetic Message Card */}
                  <div className="p-6 md:p-8 rounded-3xl glassmorphism border border-yellow-500/15 max-w-xl shadow-xl space-y-4">
                    <h3 className="font-serif text-lg md:text-xl text-pink-200 italic font-light leading-relaxed">
                      "If I had one wish today... it wouldn't be for anything I want. It would simply be that you keep smiling... because your smile has always been my favourite place."
                    </h3>
                    <p className="font-handwritten text-xl text-yellow-400 pt-2">
                      With all my heart, {config.yourName}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setStage(0);
                        setAudioStarted(false);
                      }}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-pink-950/40 hover:bg-pink-900/40 border border-pink-500/10 text-sm font-handwritten text-pink-200 transition active:scale-95 cursor-pointer shadow-lg"
                    >
                      <RotateCcw size={15} />
                      Relive our story...
                    </button>
                  </div>

                  <p className="font-handwritten text-sm text-pink-300/40">
                    Forever yours.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </main>
      </>
      )}

    </div>
  );
}
