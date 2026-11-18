import { motion, useReducedMotion } from 'motion/react';

const NOTES: string[] = [
  'I hope this small surprise of mine has brought you joy, however little',
  'And i hope you liked the flower',
  "From the day i met you, the world looks different, as if it is more colourful now and i dearly hope that it won't fade to colourlessness ever again",
  "The more things i get to know about you, i can't help but fall more in love. I would like to discover you to your deepest being, until there is nothing left to discover about you",
  "Haya, qish ham kelyapti. Qor ham yaqinda yog'ib qolsa kerak. Birinchi qor yog'ganda men bilan aylanishga chiqishga nima deysiz 😬🙂😊",
  "Ha innaykeyin, agar mabodo Oydinaxonni vaqtlari bo'lsa, yakshanba kunga ula bilan shaxmat o'ynagani ochiritga yozilib qo'ymoqchi edim",
];

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FinaleNotes() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="notes-section"
      aria-label="Personal notes"
      className="relative z-20 mx-auto w-full max-w-2xl px-6 pt-14 pb-28 sm:pt-20 sm:pb-36"
    >
      <div className="space-y-6 sm:space-y-8">
        {NOTES.map((note, idx) => (
          <motion.article
            key={idx}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24 }
            }
            whileInView={
              prefersReducedMotion
                ? { opacity: 1, transition: { duration: 0.35 } }
                : {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.75,
                      ease: SMOOTH_EASE,
                    },
                  }
            }
            viewport={{ once: true, amount: 0.25 }}
            className="rounded-2xl border border-white/10 bg-[#080b18]/70 px-6 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-8 sm:py-7"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[11px] tracking-[0.22em] text-rose-200/70">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-rose-300/20 via-amber-200/15 to-transparent" />
            </div>

            <p className="font-editorial text-xl leading-relaxed tracking-wide text-amber-50/95 sm:text-2xl [text-shadow:0_1px_14px_rgba(0,0,0,0.65)]">
              {note}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
