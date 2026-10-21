import React, { useEffect, useRef, useState } from 'react';
import { EZAZOZO_CONTENT } from '../data/content';

/* ------------------------------------------------------------------ */
/*  Types du manifest (public/frames/manifest.json)                    */
/* ------------------------------------------------------------------ */
interface FrameSet {
  width: number;
  height: number;
  pathPrefix: string;
  padding: number;
  format: string;
  totalBytes?: number;
}
interface Manifest {
  version: string;
  fps: number;
  frameCount: number;
  desktop: FrameSet;
  mobile: FrameSet;
  mobileFallback?: FrameSet;
  poster: {
    desktop: string;
    mobile: string;
    mobileFallback?: string;
  };
}

type FlightVariant = 'desktop' | 'mobile' | 'mobileFallback';

/* ------------------------------------------------------------------ */
/*  Timeline par morceaux : progression du scroll (0..1) -> seconde    */
/*  du vrai Clip A. La distance de scroll (piste en svh) est           */
/*  indépendante de la durée du clip.                                  */
/* ------------------------------------------------------------------ */
const CLIP_END = 8.0; // dernière frame (porte du salon)
const TIMELINE: Array<{ p: number; t: number }> = [
  { p: 0.0, t: 0 },
  { p: 0.06, t: 0 }, // court maintien sur la frame d'ouverture (titre lisible)
  { p: 0.48, t: 4.0 }, // Scène 01 : rue -> grill au palétuvier et maître-grilleur
  { p: 0.86, t: CLIP_END }, // Scène 02 : entrée de la terrasse -> courbe en S -> porte du salon
  { p: 1.0, t: CLIP_END } // maintien sur la porte du salon
];

// Chapitres de texte HTML synchronisés sans trou (couvrent 100% de la piste)
const BEATS: Array<{ from: number; to: number }> = [
  { from: 0, to: 0.22 }, // Scène 01 : titre principal (0 - 1.5 s)
  { from: 0.22, to: 0.72 }, // Scène 02 : le feu / le maître-grilleur (2 - 5 s)
  { from: 0.72, to: 1.01 } // Porte du salon : amorce de la Scène 03 (5 - 8 s)
];

const TRACK_HEIGHT = '280svh';
const POSTER_MOBILE = '/images/poster-mobile.webp';
const POSTER_MOBILE_FALLBACK = '/images/poster-mobile-480.webp';
const POSTER_DESKTOP = '/images/poster-desktop.webp';
const MOBILE_QUERY = '(max-width: 767px) and (orientation: portrait)';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const checkLowBandwidth = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as unknown as {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const conn = nav.connection;
  if (!conn) return false;
  if (conn.saveData === true) return true;
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;
  return false;
};

const getEffectiveVariant = (): FlightVariant => {
  if (typeof window === 'undefined') return 'desktop';
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  if (!isMobile) return 'desktop';
  return checkLowBandwidth() ? 'mobileFallback' : 'mobile';
};

const progressToTime = (p: number) => {
  for (let i = 1; i < TIMELINE.length; i++) {
    const a = TIMELINE[i - 1];
    const b = TIMELINE[i];
    if (p <= b.p) {
      const span = b.p - a.p || 1;
      return a.t + ((p - a.p) / span) * (b.t - a.t);
    }
  }
  return CLIP_END;
};

const progressToBeat = (p: number) => BEATS.findIndex((b) => p >= b.from && p < b.to);

export const FlyThroughCanvas: React.FC = () => {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [variant, setVariant] = useState<FlightVariant>(getEffectiveVariant);
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [beat, setBeat] = useState<number>(0);

  const story = EZAZOZO_CONTENT.flightStory;
  const sceneHero = story[0];
  const sceneFire = story[1];
  const sceneLounge = story[3];

  /* Manifest (une seule requête par montage ; en dev, StrictMode monte deux fois -> requête annulée) */
  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/frames/manifest.json', { signal: ctrl.signal, cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`manifest ${r.status}`))))
      .then((m: Manifest) => setManifest(m))
      .catch((err) => {
        if (err?.name !== 'AbortError') console.warn('Manifest des frames indisponible, poster conservé.', err);
      });
    return () => ctrl.abort();
  }, []);

  /* Variante mobile (HD vs Fallback basse bande passante) / desktop + préférence de mouvement réduit */
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVariant = () => setVariant(getEffectiveVariant());
    const onRm = () => setReducedMotion(rm.matches);

    mq.addEventListener('change', updateVariant);
    rm.addEventListener('change', onRm);

    const nav = navigator as unknown as {
      connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
    };
    const conn = nav.connection;
    conn?.addEventListener?.('change', updateVariant);

    return () => {
      mq.removeEventListener('change', updateVariant);
      rm.removeEventListener('change', onRm);
      conn?.removeEventListener?.('change', updateVariant);
    };
  }, []);

  /* Moteur unique : scroll -> rAF -> frame la plus proche chargée -> canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;

    let disposed = false;
    let raf = 0;
    let lastBeat = -2;
    let lastProgress = 0;
    let direction: 1 | -1 = 1;
    let targetIdx = 1;
    let drawnIdx = 0;
    let needsDraw = true;

    const set = manifest
      ? variant === 'mobileFallback'
        ? manifest.mobileFallback || manifest.mobile
        : manifest[variant]
      : null;
    const count = manifest?.frameCount ?? 0;
    const images: Array<HTMLImageElement | undefined> = new Array(count + 1);
    const requested = new Uint8Array(count + 1);
    let inFlight = 0;
    let lastDrawnImg: HTMLImageElement | null = null;

    // Fenêtre glissante bornée en RAM : conserve ~26 frames actives autour de targetIdx au lieu de 161
    const CACHE_RADIUS_AHEAD = 16;
    const CACHE_RADIUS_BEHIND = 8;

    const pruneCache = (center: number) => {
      for (let k = 2; k < count; k++) {
        if (images[k] && (k < center - CACHE_RADIUS_BEHIND || k > center + CACHE_RADIUS_AHEAD)) {
          images[k]!.src = '';
          images[k] = undefined;
          requested[k] = 0;
        }
      }
    };

    const maxConcurrent = variant === 'mobile' ? 3 : 5;
    const ctx = canvas.getContext('2d', { alpha: true });

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawnIdx = 0; // le redimensionnement efface le canvas : il faut repeindre
        needsDraw = true;
      }
    };

    const nearestLoaded = (idx: number) => {
      if (images[idx]) return idx;
      for (let d = 1; d <= Math.max(CACHE_RADIUS_AHEAD, CACHE_RADIUS_BEHIND); d++) {
        const a = idx - d * direction;
        const b = idx + d * direction;
        if (a >= 1 && a <= count && images[a]) return a;
        if (b >= 1 && b <= count && images[b]) return b;
      }
      if (images[1]) return 1;
      if (images[count]) return count;
      return 0;
    };

    const draw = () => {
      if (!ctx || reducedMotion || !count) return;
      const idx = nearestLoaded(targetIdx);
      if (idx && idx !== drawnIdx && images[idx]) {
        const img = images[idx]!;
        lastDrawnImg = img;
        const cw = canvas.width;
        const ch = canvas.height;
        const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const dw = img.naturalWidth * s;
        const dh = img.naturalHeight * s;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        drawnIdx = idx;
        canvas.style.opacity = '1';
      } else if (!drawnIdx && lastDrawnImg) {
        const cw = canvas.width;
        const ch = canvas.height;
        const s = Math.max(cw / lastDrawnImg.naturalWidth, ch / lastDrawnImg.naturalHeight);
        const dw = lastDrawnImg.naturalWidth * s;
        const dh = lastDrawnImg.naturalHeight * s;
        ctx.drawImage(lastDrawnImg, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      }
    };

    const urlFor = (i: number) =>
      `${set!.pathPrefix}${String(i).padStart(set!.padding, '0')}.${set!.format}?v=${manifest!.version}`;

    // Choisit la prochaine frame à charger dans la fenêtre glissante
    const pickNext = () => {
      for (let d = 0; d <= CACHE_RADIUS_AHEAD; d++) {
        const ahead = targetIdx + d * direction;
        const behind = targetIdx - d * direction;
        if (
          ahead >= 1 &&
          ahead <= count &&
          ahead <= targetIdx + CACHE_RADIUS_AHEAD &&
          ahead >= targetIdx - CACHE_RADIUS_BEHIND &&
          !requested[ahead]
        ) {
          return ahead;
        }
        if (
          d > 0 &&
          d <= CACHE_RADIUS_BEHIND &&
          behind >= 1 &&
          behind <= count &&
          behind <= targetIdx + CACHE_RADIUS_AHEAD &&
          behind >= targetIdx - CACHE_RADIUS_BEHIND &&
          !requested[behind]
        ) {
          return behind;
        }
      }
      return 0;
    };

    const pump = () => {
      if (disposed || !set || reducedMotion) return;
      while (inFlight < maxConcurrent) {
        const i = requested[1] ? (requested[count] ? pickNext() : count) : 1;
        if (!i) return;
        requested[i] = 1;
        inFlight++;
        const img = new Image();
        img.decoding = 'async';
        if (i === 1) (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
        img.onload = () => {
          inFlight--;
          if (disposed) return;
          // Libérer immédiatement si la frame est devenue périmée pendant le téléchargement
          if (
            i > 1 &&
            i < count &&
            (i < targetIdx - CACHE_RADIUS_BEHIND - 4 || i > targetIdx + CACHE_RADIUS_AHEAD + 4)
          ) {
            img.src = '';
            requested[i] = 0;
            pump();
            return;
          }
          images[i] = img;
          if (Math.abs(i - targetIdx) < Math.abs(drawnIdx - targetIdx) || !drawnIdx) {
            needsDraw = true;
            schedule();
          }
          pump();
        };
        img.onerror = () => {
          inFlight--;
          if (!disposed) pump();
        };
        img.src = urlFor(i);
      }
    };

    const update = () => {
      raf = 0;
      if (disposed) return;
      const rect = track.getBoundingClientRect();
      const max = track.offsetHeight - window.innerHeight;
      const p = max > 0 ? clamp01(-rect.top / max) : 0;
      if (p !== lastProgress) direction = p > lastProgress ? 1 : -1;
      lastProgress = p;

      if (count) {
        const t = progressToTime(p);
        const idx = Math.min(count, Math.max(1, Math.round(t * manifest!.fps) + 1));
        if (idx !== targetIdx) {
          targetIdx = idx;
          needsDraw = true;
          pruneCache(idx);
          pump();
        }
      }
      if (needsDraw) {
        needsDraw = false;
        draw();
      }

      const b = progressToBeat(p);
      if (b !== lastBeat) {
        lastBeat = b;
        setBeat(b);
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      sizeCanvas();
      schedule();
    };

    sizeCanvas();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    pump();
    schedule();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [manifest, variant, reducedMotion]);

  const smoothTo = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const beatClass = (i: number) =>
    `flight-beat ${beat === i ? 'is-active' : ''}`;

  return (
    <section
      ref={trackRef}
      id="visite"
      className="relative w-full"
      style={{ height: TRACK_HEIGHT }}
      aria-label="Visite immersive d’EZAZOZO en vue subjective"
    >
      <div className="flight-stage sticky top-0 w-full overflow-hidden bg-[#1a120c]">
        {/* 1. Poster : première frame du clip, affichée immédiatement pour tous les visiteurs */}
        <picture>
          <source
            media={MOBILE_QUERY}
            srcSet={variant === 'mobileFallback' ? POSTER_MOBILE_FALLBACK : POSTER_MOBILE}
          />
          <img
            src={POSTER_DESKTOP}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </picture>

        {/* 2. Canvas : frames réelles du Clip A peintes par-dessus le poster */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 select-none"
          style={{ width: '100%', height: '100%', opacity: 0, display: reducedMotion ? 'none' : 'block' }}
        />

        {/* 3. Ambiance : vignette + grain + lisibilité du texte en bas */}
        <div className="absolute inset-0 pointer-events-none flight-vignette" />
        <div className="absolute inset-0 pointer-events-none grain" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none bg-gradient-to-t from-[#0D0D0D]/90 via-[#0D0D0D]/45 to-transparent" />

        {/* Lien d'évitement */}
        <a
          href="#braise"
          onClick={smoothTo('braise')}
          className="flight-skip absolute right-3 sm:right-6 z-30 inline-flex items-center gap-1.5 min-h-[44px] px-4 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#F5F2EB]/85 bg-black/45 backdrop-blur-md border border-white/15 rounded-full hover:text-white"
        >
          Passer la visite
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>

        {/* Textes HTML réels, synchronisés sur les secondes du clip (zone basse de la scène) */}
        <div className="flight-copy absolute inset-x-0 bottom-0 z-20 px-5 sm:px-10 lg:px-16">
          <div className="relative max-w-xl lg:max-w-2xl">
            {/* Scène 01 — Arrivée */}
            <div className={beatClass(0)} aria-hidden={beat !== 0}>
              <p className="kicker text-[#FF8A5B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                Lomé · Agoé Assiyéyé
              </p>
              <h1 className="h-hero font-display font-bold text-white mt-3">{sceneHero.copyH1}</h1>
              <p className="font-accent italic text-[15px] sm:text-lg text-[#F5F2EB]/90 mt-3 max-w-md">
                {sceneHero.subCopy}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="#reserver" onClick={smoothTo('reserver')} className="btn btn-ember">
                  {sceneHero.cta}
                </a>
                <a href="#braise" onClick={smoothTo('braise')} className="btn btn-ghost">
                  La carte
                </a>
              </div>
              <p className="scroll-hint mt-5 text-[11px] uppercase tracking-[0.25em] text-[#D4AF37]/90">
                Faites défiler pour entrer
              </p>
            </div>

            {/* Scène 02 — Terrasse & braise */}
            <div className={beatClass(1)} aria-hidden={beat !== 1}>
              <p className="kicker text-[#FF8A5B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                Le maître-grilleur
              </p>
              <h2 className="h-hero font-display font-bold text-white mt-3">{sceneFire.copyH1}</h2>
              <p className="text-[15px] sm:text-base text-[#F5F2EB]/85 leading-relaxed mt-3 max-w-md">
                {sceneFire.subCopy}
              </p>
              <div className="mt-5">
                <a href="#commander" onClick={smoothTo('commander')} className="btn btn-ember">
                  {sceneFire.cta}
                </a>
              </div>
            </div>

            {/* Porte du salon — amorce de la Scène 03 */}
            <div className={beatClass(2)} aria-hidden={beat !== 2}>
              <p className="kicker text-[#D4AF37]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                Le salon · VIP 8 places
              </p>
              <h2 className="h-hero font-display font-bold text-white mt-3">{sceneLounge.copyH1}</h2>
              <p className="text-[15px] sm:text-base text-[#F5F2EB]/85 leading-relaxed mt-3 max-w-md">
                {sceneLounge.subCopy}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="#reserver" onClick={smoothTo('reserver')} className="btn btn-gold">
                  {sceneLounge.cta}
                </a>
                <a href="#braise" onClick={smoothTo('braise')} className="btn btn-ghost">
                  Continuer
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Fine barre de progression de la visite (décorative) */}
        <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-white/10 z-30 pointer-events-none">
          <div
            ref={barRef}
            className="h-full origin-left bg-gradient-to-r from-[#FF4500] to-[#D4AF37]"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </section>
  );
};
