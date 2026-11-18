import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface SpecialNote {
  motif: 'starlight' | 'lily' | 'aurora' | 'heart' | 'snow' | 'chess';
  aura: string;
  accentBorder: string;
  medallionGlow: string;
  text: string;
}

const NOTES: SpecialNote[] = [
  {
    motif: 'starlight',
    aura: 'radial-gradient(circle at 50% 28%, rgba(253, 224, 138, 0.16), rgba(244, 63, 94, 0.05) 48%, transparent 75%)',
    accentBorder: 'rgba(253, 230, 138, 0.34)',
    medallionGlow: 'rgba(253, 224, 138, 0.25)',
    text: 'I hope this small surprise of mine has brought you joy, however little',
  },
  {
    motif: 'lily',
    aura: 'radial-gradient(circle at 50% 28%, rgba(255, 228, 236, 0.16), rgba(251, 191, 36, 0.06) 48%, transparent 75%)',
    accentBorder: 'rgba(254, 205, 211, 0.34)',
    medallionGlow: 'rgba(254, 205, 211, 0.25)',
    text: 'And i hope you liked the flower',
  },
  {
    motif: 'aurora',
    aura: 'radial-gradient(circle at 50% 28%, rgba(244, 114, 182, 0.14), rgba(167, 139, 250, 0.08) 46%, transparent 75%)',
    accentBorder: 'rgba(249, 168, 212, 0.34)',
    medallionGlow: 'rgba(244, 114, 182, 0.24)',
    text: "From the day i met you, the world looks different, as if it is more colourful now and i dearly hope that it won't fade to colourlessness ever again",
  },
  {
    motif: 'heart',
    aura: 'radial-gradient(circle at 50% 28%, rgba(244, 63, 94, 0.18), rgba(251, 113, 133, 0.06) 48%, transparent 75%)',
    accentBorder: 'rgba(251, 113, 133, 0.38)',
    medallionGlow: 'rgba(244, 63, 94, 0.28)',
    text: "The more things i get to know about you, i can't help but fall more in love. I would like to discover you to your deepest being, until there is nothing left to discover about you",
  },
  {
    motif: 'snow',
    aura: 'radial-gradient(circle at 50% 28%, rgba(186, 230, 253, 0.16), rgba(224, 242, 254, 0.05) 48%, transparent 75%)',
    accentBorder: 'rgba(186, 230, 253, 0.36)',
    medallionGlow: 'rgba(186, 230, 253, 0.26)',
    text: "Haya, qish ham kelyapti. Qor ham yaqinda yog'ib qolsa kerak. Birinchi qor yog'ganda men bilan aylanishga chiqishga nima deysiz 😬🙂😊",
  },
  {
    motif: 'chess',
    aura: 'radial-gradient(circle at 50% 28%, rgba(251, 191, 36, 0.18), rgba(244, 63, 94, 0.06) 48%, transparent 75%)',
    accentBorder: 'rgba(252, 211, 77, 0.38)',
    medallionGlow: 'rgba(251, 191, 36, 0.28)',
    text: 'keyn yakshanba chess gooo?',
  },
];

const SPARKLE_POSITIONS = [
  { top: '12%', left: '8%', delay: 0, size: 11 },
  { top: '20%', right: '9%', delay: 0.7, size: 9 },
  { bottom: '22%', left: '10%', delay: 1.3, size: 8 },
  { bottom: '16%', right: '11%', delay: 0.4, size: 10 },
];

const NOTE_COUNT = NOTES.length;
const SLOT_OFFSETS = [-2, -1, 0, 1, 2] as const;
const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function wrapIndex(index: number): number {
  return ((index % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT;
}

function CornerFiligree({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 28 C2 12.5, 12.5 2, 28 2"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeOpacity="0.6"
      />
      <path
        d="M2 17 C6 9, 9 6, 17 2"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeOpacity="0.38"
      />
      <path
        d="M7 22 C7 13.5, 13.5 7, 22 7"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeDasharray="1.5 2.5"
        strokeOpacity="0.45"
      />
      <circle cx="5" cy="5" r="1.5" fill="currentColor" fillOpacity="0.85" />
      <path
        d="M13.5 3 L14.8 5 L16.8 6.3 L14.8 7.6 L13.5 9.6 L12.2 7.6 L10.2 6.3 L12.2 5 Z"
        fill="currentColor"
        fillOpacity="0.48"
      />
    </svg>
  );
}

function NoteEmblem({ motif }: { motif: SpecialNote['motif'] }) {
  switch (motif) {
    case 'starlight':
      return (
        <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5 text-amber-200">
          <path
            d="M14 2.5 L16.3 11.7 L25.5 14 L16.3 16.3 L14 25.5 L11.7 16.3 L2.5 14 L11.7 11.7 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <circle cx="21" cy="7" r="1.1" fill="currentColor" />
          <circle cx="7" cy="21" r="0.9" fill="currentColor" fillOpacity="0.7" />
        </svg>
      );
    case 'lily':
      return (
        <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5 text-rose-100">
          <path
            d="M14 4 C16.5 9, 17 14, 14 19 C11 14, 11.5 9, 14 4 Z"
            stroke="currentColor"
            strokeWidth="1.15"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <path
            d="M14 19 C9.5 16.5, 5.5 13, 4.5 8.5 C9 9, 12 12.5, 14 19 Z"
            stroke="currentColor"
            strokeWidth="1.1"
            fill="currentColor"
            fillOpacity="0.14"
          />
          <path
            d="M14 19 C18.5 16.5, 22.5 13, 23.5 8.5 C19 9, 16 12.5, 14 19 Z"
            stroke="currentColor"
            strokeWidth="1.1"
            fill="currentColor"
            fillOpacity="0.14"
          />
          <path d="M14 19 L14 24.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
        </svg>
      );
    case 'aurora':
      return (
        <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5 text-pink-200">
          <path
            d="M17.5 4.5 A9.5 9.5 0 1 0 23.5 17.5 A7.5 7.5 0 1 1 17.5 4.5 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <path
            d="M20.5 7.5 L21.3 9.5 L23.3 10.3 L21.3 11.1 L20.5 13.1 L19.7 11.1 L17.7 10.3 L19.7 9.5 Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5 text-rose-300">
          <path
            d="M14 23.5 C14 23.5 4.5 17.2 4.5 10.6 C4.5 7.4 7 5 10 5 C11.9 5 13.3 6 14 7.4 C14.7 6 16.1 5 18 5 C21 5 23.5 7.4 23.5 10.6 C23.5 17.2 14 23.5 14 23.5 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="currentColor"
            fillOpacity="0.28"
          />
        </svg>
      );
    case 'snow':
      return (
        <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5 text-sky-200">
          <path
            d="M14 3 V25 M4.5 8.5 L23.5 19.5 M23.5 8.5 L4.5 19.5"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
          <path
            d="M11.5 5.5 L14 8 L16.5 5.5 M11.5 22.5 L14 20 L16.5 22.5 M6.5 12 L9.5 11.4 L8.5 8.4 M19.5 19.6 L18.5 16.6 L21.5 16 M21.5 12 L18.5 11.4 L19.5 8.4 M8.5 19.6 L9.5 16.6 L6.5 16"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'chess':
      return (
        <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5 text-amber-200">
          <path
            d="M8.5 23.5 H19.5 M9.5 20.5 H18.5 L17.4 17.5 C17.4 14 19.5 11.5 19.5 8.8 C19.5 5.8 16.5 4.2 13.5 4.2 L12.5 2.8 L11 4.8 C8.8 6 7.5 8 7.5 10.2 L10.8 11.3 C11.8 11.6 13.2 11.1 14 10.5 C13.5 13 11.2 15.2 10.3 17.5 L9.5 20.5 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </svg>
      );
  }
}

export function FinaleNotes() {
  const [cursor, setCursor] = useState(0);
  const [hoverTilt, setHoverTilt] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();
  const swipeStartXRef = useRef<number | null>(null);

  const activeIndex = wrapIndex(cursor);
  const activeItem = NOTES[activeIndex];

  const goPrev = useCallback(() => {
    setHoverTilt({ x: 0, y: 0 });
    setCursor((prev) => prev - 1);
  }, []);

  const goNext = useCallback(() => {
    setHoverTilt({ x: 0, y: 0 });
    setCursor((prev) => prev + 1);
  }, []);

  const goToNote = useCallback(
    (targetIdx: number) => {
      let delta = targetIdx - activeIndex;
      if (delta > NOTE_COUNT / 2) delta -= NOTE_COUNT;
      if (delta < -NOTE_COUNT / 2) delta += NOTE_COUNT;
      if (delta !== 0) {
        setHoverTilt({ x: 0, y: 0 });
        setCursor((prev) => prev + delta);
      }
    },
    [activeIndex],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  return (
    <section
      id="notes-section"
      aria-label="Personal notes"
      className="relative z-20 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden pt-10 pb-14 sm:pt-14 sm:pb-16"
    >
      {/* Dynamic per-note atmospheric starlight aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[44%] h-[460px] w-[min(94vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-700"
        style={{ background: activeItem.aura }}
      />

      {/* 3D Perspective Carousel Stage */}
      <div
        style={{ perspective: '1300px' }}
        onPointerDown={(e) => {
          swipeStartXRef.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipeStartXRef.current === null) return;
          const dx = e.clientX - swipeStartXRef.current;
          swipeStartXRef.current = null;
          if (Math.abs(dx) > 45) {
            if (dx < 0) goNext();
            else goPrev();
          }
        }}
        onPointerCancel={() => {
          swipeStartXRef.current = null;
        }}
        className="relative flex min-h-[395px] w-full max-w-5xl items-center justify-center sm:min-h-[420px]"
      >
        {SLOT_OFFSETS.map((offset) => {
          const virtualIdx = cursor + offset;
          const noteIdx = wrapIndex(virtualIdx);
          const item = NOTES[noteIdx];

          const isCenter = offset === 0;
          const isLeft = offset === -1;
          const isRight = offset === 1;
          const isVisible = Math.abs(offset) <= 1;

          const xShift =
            offset === 0
              ? '0%'
              : offset < 0
                ? offset === -1
                  ? '-86%'
                  : '-148%'
                : offset === 1
                  ? '86%'
                  : '148%';

          const scale = isCenter ? 1 : isVisible ? 0.83 : 0.7;
          const opacity = isCenter ? 1 : isVisible ? 0.36 : 0;
          const baseRotateY = prefersReducedMotion ? 0 : offset === 0 ? 0 : offset < 0 ? 16 : -16;
          const rotateY = isCenter && !prefersReducedMotion ? hoverTilt.y : baseRotateY;
          const rotateX = isCenter && !prefersReducedMotion ? hoverTilt.x : 0;

          return (
            <motion.article
              key={virtualIdx}
              onClick={() => {
                if (isLeft) goPrev();
                else if (isRight) goNext();
              }}
              onPointerMove={(e) => {
                if (!isCenter || prefersReducedMotion) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
                const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
                setHoverTilt({ x: -ny * 4.5, y: nx * 5.5 });
              }}
              onPointerLeave={() => {
                if (isCenter) setHoverTilt({ x: 0, y: 0 });
              }}
              aria-hidden={!isCenter}
              initial={{
                x: xShift,
                scale,
                opacity,
                rotateY: baseRotateY,
                rotateX: 0,
              }}
              animate={{
                x: xShift,
                scale,
                opacity,
                rotateY,
                rotateX,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.15 }
                  : { duration: 0.56, ease: SMOOTH_EASE }
              }
              style={{
                zIndex: isCenter ? 30 : isVisible ? 20 : 10,
                transformStyle: 'preserve-3d',
                borderColor: isCenter ? item.accentBorder : undefined,
              }}
              className={`absolute flex min-h-[330px] w-[74vw] max-w-[500px] flex-col justify-between overflow-hidden rounded-[28px] border px-7 py-8 backdrop-blur-xl sm:min-h-[350px] sm:w-[460px] sm:px-11 sm:py-9 md:w-[500px] ${
                isCenter
                  ? 'bg-gradient-to-br from-[#141835]/94 via-[#090c1e]/96 to-[#190e22]/94 shadow-[0_28px_80px_rgba(0,0,0,0.82),0_0_60px_rgba(244,63,94,0.12),inset_0_1px_0_rgba(255,240,215,0.28)]'
                  : isVisible
                    ? 'cursor-pointer border-white/10 bg-[#080b18]/60 shadow-[0_12px_34px_rgba(0,0,0,0.5)] hover:border-amber-200/25'
                    : 'pointer-events-none border-white/5 bg-[#080b18]/40'
              }`}
            >
              {/* Inner per-note celestial sheen */}
              {isCenter && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-90"
                  style={{ background: item.aura }}
                />
              )}

              {/* Double ornamental stationery frame */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-3 rounded-[20px] border transition-opacity duration-500 ${
                  isCenter ? 'border-amber-100/20 opacity-100' : 'border-white/8 opacity-35'
                }`}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-[17px] rounded-[16px] border border-dashed transition-opacity duration-500 ${
                  isCenter ? 'border-amber-200/12 opacity-100' : 'opacity-0'
                }`}
              />

              {/* Subtle twinkling 4-point starlight sparkles inside the active card */}
              {isCenter &&
                !prefersReducedMotion &&
                SPARKLE_POSITIONS.map((sp, sIdx) => (
                  <motion.svg
                    key={sIdx}
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    style={{
                      top: sp.top,
                      bottom: sp.bottom,
                      left: sp.left,
                      right: sp.right,
                      width: sp.size,
                      height: sp.size,
                    }}
                    animate={{ opacity: [0.22, 0.85, 0.22], scale: [0.85, 1.15, 0.85] }}
                    transition={{
                      duration: 3.2,
                      delay: sp.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="pointer-events-none absolute text-amber-200/80"
                  >
                    <path
                      d="M8 1 L9.4 6.6 L15 8 L9.4 9.4 L8 15 L6.6 9.4 L1 8 L6.6 6.6 Z"
                      fill="currentColor"
                    />
                  </motion.svg>
                ))}

              <CornerFiligree
                className={`pointer-events-none absolute top-3.5 left-3.5 h-9 w-9 ${
                  isCenter ? 'text-amber-200/75' : 'text-slate-400/25'
                }`}
              />
              <CornerFiligree
                className={`pointer-events-none absolute top-3.5 right-3.5 h-9 w-9 rotate-90 ${
                  isCenter ? 'text-amber-200/75' : 'text-slate-400/25'
                }`}
              />
              <CornerFiligree
                className={`pointer-events-none absolute bottom-3.5 right-3.5 h-9 w-9 rotate-180 ${
                  isCenter ? 'text-amber-200/75' : 'text-slate-400/25'
                }`}
              />
              <CornerFiligree
                className={`pointer-events-none absolute bottom-3.5 left-3.5 h-9 w-9 -rotate-90 ${
                  isCenter ? 'text-amber-200/75' : 'text-slate-400/25'
                }`}
              />

              {/* Top engraved medallion seal */}
              <div className="relative z-10 flex items-center justify-center gap-3">
                <span className="h-px w-12 bg-gradient-to-r from-transparent via-amber-200/35 to-amber-100/50" />
                <div
                  style={
                    isCenter
                      ? { boxShadow: `0 0 24px ${item.medallionGlow}, inset 0 0 12px ${item.medallionGlow}` }
                      : undefined
                  }
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border ${
                    isCenter
                      ? 'border-amber-200/40 bg-[#121633]/90'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-1 rounded-full border ${
                      isCenter ? 'border-amber-100/20' : 'border-white/5'
                    }`}
                  />
                  <NoteEmblem motif={item.motif} />
                </div>
                <span className="h-px w-12 bg-gradient-to-l from-transparent via-amber-200/35 to-amber-100/50" />
              </div>

              {/* Heartfelt note body */}
              <div className="relative z-10 my-6 flex flex-1 items-center justify-center">
                <p
                  className={`font-editorial text-center text-xl leading-[1.58] tracking-wide sm:text-[26px] ${
                    isCenter
                      ? 'text-amber-50 [text-shadow:0_2px_20px_rgba(0,0,0,0.85),0_0_28px_rgba(253,230,138,0.14)]'
                      : 'text-slate-200/65 line-clamp-4'
                  }`}
                >
                  {item.text}
                </p>
              </div>

              {/* Delicate celestial crescent-diamond bottom flourish */}
              <div
                className="relative z-10 flex items-center justify-center gap-3"
                aria-hidden="true"
              >
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-200/35" />
                <span className="h-1 w-1 rounded-full bg-amber-200/45" />
                <span className="h-2 w-2 rotate-45 border border-amber-200/60 bg-amber-100/25" />
                <span className="h-1 w-1 rounded-full bg-amber-200/45" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-200/35" />
              </div>
            </motion.article>
          );
        })}

        {/* Left celestial arrow button */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous note"
          className="absolute left-1.5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/30 bg-[#0b0f24]/90 text-amber-100 shadow-[0_8px_28px_rgba(0,0,0,0.65),0_0_20px_rgba(251,191,36,0.14)] backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-amber-200/60 hover:bg-[#161e42] hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 sm:left-6"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Right celestial arrow button */}
        <button
          type="button"
          onClick={goNext}
          aria-label="Next note"
          className="absolute right-1.5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/30 bg-[#0b0f24]/90 text-amber-100 shadow-[0_8px_28px_rgba(0,0,0,0.65),0_0_20px_rgba(251,191,36,0.14)] backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-amber-200/60 hover:bg-[#161e42] hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 sm:right-6"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Starlight diamond pagination indicators */}
      <div
        className="mt-4 flex items-center justify-center gap-2.5"
        role="tablist"
        aria-label="Note selector"
      >
        {NOTES.map((_, idx) => {
          const isCurrent = idx === activeIndex;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Note ${idx + 1}`}
              onClick={() => goToNote(idx)}
              className="group flex h-8 w-5 items-center justify-center focus-visible:outline-none"
            >
              <span
                className={`block transition-all duration-300 ${
                  isCurrent
                    ? 'h-2 w-2 rotate-45 bg-amber-200 shadow-[0_0_12px_rgba(253,230,138,0.85)]'
                    : 'h-1.5 w-1.5 rounded-full bg-white/25 group-hover:bg-amber-100/65'
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
