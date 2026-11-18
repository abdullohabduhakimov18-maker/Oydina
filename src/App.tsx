import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SpaceParticleCanvas, type ExperienceStage } from './components/SpaceParticleCanvas';
import { MultilingualLoveCaption } from './components/MultilingualLoveCaption';
import { FinaleNotes } from './components/FinaleNotes';

const OPENING_DURATION_MS = 2500;
const CIRCULATE_DURATION_MS = 1850;
const NAME_HOLD_DURATION_MS = 3200;
const BACKGROUND_TRACK_SRC = '/assets/aistudio/GJAj5ZvLcag__1__f1f3f661.mp3';
const TARGET_VOLUME = 0.85;

export default function App() {
  const [stage, setStage] = useState<ExperienceStage>('envelope');
  const [envelopeReady, setEnvelopeReady] = useState(false);
  const [showFlowerCaption, setShowFlowerCaption] = useState(false);
  const [needsAudioTap, setNeedsAudioTap] = useState(false);

  const timersRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clearScheduled = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearScheduled();
    };
  }, [clearScheduled]);

  // Keep viewport at top during pre-flower stages
  useEffect(() => {
    if (stage !== 'flower' && typeof window !== 'undefined' && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [stage]);

  // Start background music immediately on entry; if browser blocks unmuted autoplay, unlock on first gesture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = TARGET_VOLUME;
    audio.muted = false;
    let disposed = false;

    const removeAllListeners = () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('loadeddata', tryAutoPlay);
      audio.removeEventListener('canplay', tryAutoPlay);
      window.removeEventListener('focus', tryAutoPlay);
      window.removeEventListener('pageshow', tryAutoPlay);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('click', unlockFromGesture, true);
      window.removeEventListener('touchend', unlockFromGesture, true);
      window.removeEventListener('mouseup', unlockFromGesture, true);
      window.removeEventListener('keydown', unlockFromGesture, true);
    };

    const onPlaying = () => {
      if (disposed) return;
      if (!audio.paused && !audio.muted) {
        setNeedsAudioTap(false);
        removeAllListeners();
      }
    };

    const tryAutoPlay = () => {
      if (disposed || !audio.paused) return;
      audio.volume = TARGET_VOLUME;
      audio.muted = false;
      void audio
        .play()
        .then(() => {
          if (!disposed) {
            setNeedsAudioTap(false);
          }
        })
        .catch(() => {
          if (!disposed && audio.paused) {
            setNeedsAudioTap(true);
          }
        });
    };

    const unlockFromGesture = () => {
      if (disposed) return;
      audio.volume = TARGET_VOLUME;
      audio.muted = false;
      if (!audio.paused) {
        setNeedsAudioTap(false);
        removeAllListeners();
        return;
      }
      void audio
        .play()
        .then(() => {
          if (!disposed) {
            setNeedsAudioTap(false);
          }
        })
        .catch(() => {
          // Keep gesture listeners attached if still blocked
        });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tryAutoPlay();
      }
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('loadeddata', tryAutoPlay);
    audio.addEventListener('canplay', tryAutoPlay);
    window.addEventListener('focus', tryAutoPlay);
    window.addEventListener('pageshow', tryAutoPlay);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('click', unlockFromGesture, { capture: true, passive: true });
    window.addEventListener('touchend', unlockFromGesture, { capture: true, passive: true });
    window.addEventListener('mouseup', unlockFromGesture, { capture: true, passive: true });
    window.addEventListener('keydown', unlockFromGesture, { capture: true, passive: true });

    tryAutoPlay();

    return () => {
      disposed = true;
      removeAllListeners();
    };
  }, []);

  // Fade in "For you" and "Open the envelope" right as the space dots finish forming the envelope
  useEffect(() => {
    if (stage !== 'envelope') return;
    setEnvelopeReady(false);
    const readyTimer = window.setTimeout(() => {
      setEnvelopeReady(true);
    }, 1550);
    return () => window.clearTimeout(readyTimer);
  }, [stage]);

  const handleOpenEnvelope = useCallback(() => {
    if (stage !== 'envelope') return;
    clearScheduled();
    setShowFlowerCaption(false);

    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.volume = TARGET_VOLUME;
      audio.muted = false;
      void audio.play().catch(() => {});
    }

    setStage('opening');

    const circulateTimer = window.setTimeout(() => {
      setStage('circulating');
    }, OPENING_DURATION_MS);

    const nameTimer = window.setTimeout(() => {
      setStage('name');
    }, OPENING_DURATION_MS + CIRCULATE_DURATION_MS);

    const flowerTimer = window.setTimeout(() => {
      setStage('flower');
    }, OPENING_DURATION_MS + CIRCULATE_DURATION_MS + NAME_HOLD_DURATION_MS);

    const captionTimer = window.setTimeout(() => {
      setShowFlowerCaption(true);
    }, OPENING_DURATION_MS + CIRCULATE_DURATION_MS + NAME_HOLD_DURATION_MS + 2750);

    timersRef.current = [circulateTimer, nameTimer, flowerTimer, captionTimer];
  }, [clearScheduled, stage]);

  const handleScrollToNotes = useCallback(() => {
    const el = document.getElementById('notes-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const canScroll = stage === 'flower' && showFlowerCaption;

  return (
    <main
      className={`relative w-full bg-[#05060c] select-none ${
        canScroll ? 'min-h-[100svh] overflow-x-hidden' : 'h-[100svh] overflow-hidden'
      }`}
    >
      {/* Headless background audio (kept out of display:none so WebKit/Safari decodes immediately) */}
      <audio
        ref={audioRef}
        src={BACKGROUND_TRACK_SRC}
        autoPlay
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Subtle transient notice only if browser autoplay policy blocks sound until first tap */}
      {needsAudioTap && (
        <p className="pointer-events-none fixed inset-x-0 top-5 z-30 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400/75">
          Tap anywhere for sound
        </p>
      )}

      {/* Full-screen celestial particle field */}
      <SpaceParticleCanvas
        stage={stage}
        onOpenEnvelope={handleOpenEnvelope}
      />

      {/* Hero Viewport (100svh) holding envelope and lily finale captions */}
      <section className="relative h-[100svh] w-full pointer-events-none">
        {/* Stage 1: "For you" text & Open trigger below the envelope */}
        <div
          className={`pointer-events-none absolute inset-x-0 z-20 flex flex-col items-center px-6 transition-all duration-700 ${
            stage === 'envelope' && envelopeReady
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
          style={{ top: 'calc(40vh + min(36vw, 170px) * 0.64 + 28px)' }}
        >
          <p className="font-editorial text-3xl sm:text-4xl font-normal tracking-wide text-slate-100 drop-shadow-[0_2px_18px_rgba(255,255,255,0.22)]">
            For you
          </p>

          <button
            type="button"
            onClick={handleOpenEnvelope}
            disabled={stage !== 'envelope' || !envelopeReady}
            tabIndex={stage === 'envelope' && envelopeReady ? 0 : -1}
            className="pointer-events-auto mt-5 min-h-[44px] whitespace-nowrap rounded-full border border-rose-400/35 bg-rose-500/15 px-7 py-2.5 text-sm font-medium tracking-wide text-rose-100 backdrop-blur-sm transition-all duration-200 hover:border-rose-300/60 hover:bg-rose-500/25 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:pointer-events-none"
          >
            Open the envelope
          </button>
        </div>

        {/* Stage 4: "I love you" cycling through world languages + scroll-down instruction */}
        <div
          className={`pointer-events-none absolute inset-x-0 z-20 flex flex-col items-center px-6 transition-all duration-1000 ${
            canScroll
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
          style={{ top: '65%' }}
        >
          <MultilingualLoveCaption active={canScroll} />

          <button
            type="button"
            onClick={handleScrollToNotes}
            disabled={!canScroll}
            tabIndex={canScroll ? 0 : -1}
            className="pointer-events-auto mt-3 inline-flex min-h-[44px] flex-col items-center justify-center gap-1.5 px-5 py-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-100/80 transition-colors duration-200 hover:text-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 disabled:pointer-events-none"
          >
            <span>Scroll down</span>
            <ChevronDown className="h-4 w-4 animate-bounce text-amber-200/85" />
          </button>
        </div>
      </section>

      {/* Scroll-down personal notes revealed after the lily bloom */}
      {canScroll && <FinaleNotes />}
    </main>
  );
}
