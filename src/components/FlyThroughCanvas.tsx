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
/* ------------------------------------------------------------------ */
const CLIP_END = 8.0; // dernière frame (porte du salon)
const TIMELINE: Array<{ p: number; t: number }> = [
  { p: 0.0, t: 0 },
  { p: 0.06, t: 0 }, // court maintien sur la frame d'ouverture
  { p: 0.48, t: 4.0 }, // Scène 01 : rue -> grill au palétuvier et maître-grilleur
  { p: 0.86, t: CLIP_END }, // Scène 02 : entrée de la terrasse -> porte du salon
  { p: 1.0, t: CLIP_END } // maintien sur la porte du salon
];

// Chapitres de texte HTML synchronisés
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

  // Hidden diagnostic overlay (?debug=1)
  const [isDebug, setIsDebug] = useState<boolean>(false);
  const [diagInfo, setDiagInfo] = useState({
    drawnIdx: 0,
    targetIdx: 1,
    frameCount: 0,
    loadedCount: 0,
    variantName: '',
    connType: '',
    lastError: 'aucune'
  });

  const story = EZAZOZO_CONTENT.flightStory;
  const sceneFire = story[1];
  const sceneLounge = story[3];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      setIsDebug(p.get('debug') === '1');
    }
  }, []);

  /* Manifest (une seule requête par montage) */
  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/frames/manifest.json', { signal: ctrl.signal, cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`manifest ${r.status}`))))
      .then((m: Manifest) => setManifest(m))
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('[FlyThrough] Manifest des frames indisponible, poster conservé.', err);
          setDiagInfo((prev) => ({ ...prev, lastError: `Manifest indisponible: ${err?.message || err}` }));
        }
      });
    return () => ctrl.abort();
  }, []);

  /* Détection de la variante d'affichage et préférence de mouvement */
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

  /* Moteur de lecture vidéo au scroll */
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
    let loadedCount = 0;
    let lastDrawnImg: HTMLImageElement | null = null;
    let lastErrorMsg = 'aucune';

    const maxConcurrent = variant === 'desktop' ? 8 : 6;
    const ctx = canvas.getContext('2d', { alpha: true });

    const updateDiag = () => {
      if (!isDebug) return;
      const nav = navigator as unknown as {
        connection?: { saveData?: boolean; effectiveType?: string; downlink?: number };
      };
      const c = nav?.connection;
      const connStr = c
        ? `${c.effectiveType || 'inconnu'}${c.saveData ? ' [saveData]' : ''}${c.downlink ? ` (${c.downlink}Mb/s)` : ''}`
        : 'inconnue';

      setDiagInfo({
        drawnIdx,
        targetIdx,
        frameCount: count,
        loadedCount,
        variantName: `${variant} (${set ? `${set.width}x${set.height}` : 'chargement'})`,
        connType: connStr,
        lastError: lastErrorMsg
      });
    };

    const paintImage = (img: HTMLImageElement) => {
      if (!ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      if (cw <= 0 || ch <= 0) return;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = Math.round(img.naturalWidth * s);
      const dh = Math.round(img.naturalHeight * s);
      const dx = Math.round((cw - dw) / 2);
      const dy = Math.round((ch - dh) / 2);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      // Évite de réinitialiser le canvas sur les micro-variations de l'adresse bar mobile (< 24px)
      const widthChanged = Math.abs(canvas.width - w) > 2;
      const heightChanged = Math.abs(canvas.height - h) > 24;
      if (widthChanged || heightChanged) {
        canvas.width = w;
        canvas.height = h;
        // Repeindre immédiatement le dernier visuel pour éviter tout écran blanc
        if (lastDrawnImg) {
          paintImage(lastDrawnImg);
        }
        needsDraw = true;
      }
    };

    // Trouve la frame chargée la plus proche de idx, dans toute la séquence
    const nearestLoaded = (idx: number) => {
      if (images[idx]) return idx;
      for (let d = 1; d <= count; d++) {
        const ahead = idx + d * direction;
        const behind = idx - d * direction;
        if (ahead >= 1 && ahead <= count && images[ahead]) return ahead;
        if (behind >= 1 && behind <= count && images[behind]) return behind;
      }
      // Si aucune frame n'est trouvée, conserver l'index déjà dessiné plutôt que de sauter à 1
      return drawnIdx || (images[1] ? 1 : 0);
    };

    const draw = () => {
      if (!ctx || reducedMotion || !count) return;
      const idx = nearestLoaded(targetIdx);
      if (idx && images[idx]) {
        const img = images[idx]!;
        lastDrawnImg = img;
        paintImage(img);
        drawnIdx = idx;
        canvas.style.opacity = '1';
        updateDiag();
      } else if (!drawnIdx && lastDrawnImg) {
        paintImage(lastDrawnImg);
      } else if (!drawnIdx && !images[1]) {
        console.warn('[FlyThrough] En attente de la première frame, affichage du poster');
      }
    };

    const urlFor = (i: number) =>
      `${set!.pathPrefix}${String(i).padStart(set!.padding, '0')}.${set!.format}?v=${manifest!.version}`;

    // Sélectionne la frame la plus prioritaire : spirale autour de targetIdx
    const pickNext = () => {
      // 1. Frame cible immédiate
      if (!requested[targetIdx]) return targetIdx;
      // 2. Frames immédiates dans la direction de lecture
      for (let d = 1; d <= count; d++) {
        const ahead = targetIdx + d * direction;
        if (ahead >= 1 && ahead <= count && !requested[ahead]) {
          return ahead;
        }
        const behind = targetIdx - d * direction;
        if (behind >= 1 && behind <= count && !requested[behind]) {
          return behind;
        }
      }
      return 0;
    };

    const pump = () => {
      if (disposed || !set || reducedMotion) return;
      while (inFlight < maxConcurrent) {
        const i = pickNext();
        if (!i) return;
        requested[i] = 1;
        inFlight++;
        const img = new Image();
        img.decoding = 'async';
        if (i === 1) (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';

        img.onload = () => {
          inFlight--;
          if (disposed) return;
          images[i] = img;
          loadedCount++;
          // Redessiner si cette frame est plus proche de la cible que la frame affichée
          if (Math.abs(i - targetIdx) < Math.abs(drawnIdx - targetIdx) || !drawnIdx) {
            needsDraw = true;
            schedule();
          }
          updateDiag();
          pump();
        };

        img.onerror = (e) => {
          inFlight--;
          lastErrorMsg = `Frame ${i} non chargée (${urlFor(i)})`;
          console.warn(`[FlyThrough] Erreur chargement frame ${i}:`, urlFor(i), e);
          updateDiag();
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
      if (p !== lastProgress) direction = p >= lastProgress ? 1 : -1;
      lastProgress = p;

      if (count) {
        const t = progressToTime(p);
        const idx = Math.min(count, Math.max(1, Math.round(t * manifest!.fps) + 1));
        if (idx !== targetIdx) {
          targetIdx = idx;
          needsDraw = true;
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
    window.addEventListener('touchmove', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    pump();
    schedule();
    updateDiag();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('touchmove', schedule);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [manifest, variant, reducedMotion, isDebug]);

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
        {/* 1. Poster : première frame du clip, affichée immédiatement */}
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

        {/* 3. Ambiance : vignette + grain + dégradé de contraste cinématique */}
        <div className="absolute inset-0 pointer-events-none flight-vignette" />
        <div className="absolute inset-0 pointer-events-none grain" />
        
        {/* Scrim dégradé cinématique : renforce le contraste du texte sans boîte plate */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505]/95 via-[#0D0D0D]/65 to-transparent lg:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(5,5,5,0.95)_0%,_rgba(13,13,13,0.70)_45%,_transparent_75%)]" />

        {/* Passer la visite : lien discret en bas à droite, petit, sans pilule ni bordure */}
        <a
          href="#menu"
          onClick={smoothTo('menu')}
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-30 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-medium text-[#F5F2EB]/65 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-white/40"
        >
          <span>Passer la visite</span>
          <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>

        {/* Textes HTML réels, synchronisés sur le scroll */}
        <div className="flight-copy absolute inset-x-0 bottom-0 z-20 px-5 sm:px-10 lg:px-16">
          <div className="relative max-w-xl lg:max-w-2xl">
            {/* Scène 01 — Hero d'arrivée (Redesign Haute Gastronomie) */}
            <div className={beatClass(0)} aria-hidden={beat !== 0}>
              {/* Eyebrow : ivoire / or pâle avec filet doré fin */}
              <p className="inline-flex items-center text-[#E6CA65] text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium font-sans">
                <span className="inline-block w-5 sm:w-6 h-[1px] bg-[#D4AF37] mr-2.5 opacity-80" aria-hidden="true" />
                Lomé · Agoé Assiyéyé
              </p>

              {/* Titre : serif raffiné light/medium, sentence case, accent braise */}
              <h1 className="font-serif font-light sm:font-normal text-[2.15rem] sm:text-[2.85rem] lg:text-[3.7rem] xl:text-[4.25rem] leading-[1.1] text-white tracking-tight mt-3 text-balance drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)] animate-hero-rise">
                Ici, le poisson se{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] via-[#FF4500] to-[#D4AF37] font-normal">
                  braise
                </span>{' '}
                au feu de bois.
              </h1>

              {/* Sous-titre : court, sans-serif lisible, ivoire à 85% */}
              <p className="font-sans text-[14px] sm:text-base text-[#F5F2EB]/85 leading-relaxed mt-3.5 max-w-lg">
                Haute braise au feu de palétuvier et lounge gastronomique. Poissons entiers braisés minute, terrasse couverte et salon VIP.
              </p>

              {/* CTAs : 1 bouton primaire braise + 1 lien texte fléché vers le Menu */}
              <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6">
                <a
                  href="#reserver"
                  onClick={smoothTo('reserver')}
                  className="btn btn-ember shadow-[0_0_24px_rgba(255,69,0,0.35)] active:scale-[0.98]"
                >
                  Réserver une table
                </a>
                <a
                  href="#menu"
                  onClick={smoothTo('menu')}
                  className="group inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider font-semibold text-[#F5F2EB]/90 hover:text-[#D4AF37] transition-colors py-2 px-1 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] rounded"
                >
                  <span>Voir le menu</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Repère de défilement : fine ligne verticale avec pulsation lumineuse */}
              <div className="mt-6 sm:mt-8 flex items-center gap-3">
                <div className="relative w-[1px] h-7 bg-white/20 overflow-hidden" aria-hidden="true">
                  <span className="scroll-line-light absolute inset-x-0 h-3 bg-gradient-to-b from-transparent via-[#FF6B35] to-transparent w-full" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#F5F2EB]/80 select-none">
                  Défiler
                </span>
              </div>
            </div>

            {/* Scène 02 — Terrasse & braise */}
            <div className={beatClass(1)} aria-hidden={beat !== 1}>
              <p className="inline-flex items-center text-[#E6CA65] text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium font-sans">
                <span className="inline-block w-5 sm:w-6 h-[1px] bg-[#D4AF37] mr-2.5 opacity-80" aria-hidden="true" />
                Le maître-grilleur
              </p>
              <h2 className="font-serif font-light sm:font-normal text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem] leading-[1.12] text-white tracking-tight mt-3 text-balance">
                {sceneFire.copyH1}
              </h2>
              <p className="font-sans text-[14px] sm:text-base text-[#F5F2EB]/85 leading-relaxed mt-3 max-w-md">
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
              <p className="inline-flex items-center text-[#D4AF37] text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium font-sans">
                <span className="inline-block w-5 sm:w-6 h-[1px] bg-[#D4AF37] mr-2.5 opacity-80" aria-hidden="true" />
                Le salon · VIP 8 places
              </p>
              <h2 className="font-serif font-light sm:font-normal text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem] leading-[1.12] text-white tracking-tight mt-3 text-balance">
                {sceneLounge.copyH1}
              </h2>
              <p className="font-sans text-[14px] sm:text-base text-[#F5F2EB]/85 leading-relaxed mt-3 max-w-md">
                {sceneLounge.subCopy}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6">
                <a href="#reserver" onClick={smoothTo('reserver')} className="btn btn-gold">
                  {sceneLounge.cta}
                </a>
                <a
                  href="#menu"
                  onClick={smoothTo('menu')}
                  className="group inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider font-semibold text-[#F5F2EB]/90 hover:text-[#D4AF37] transition-colors py-2 px-1 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] rounded"
                >
                  <span>Voir le menu</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Fine barre de progression de la visite */}
        <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-white/10 z-30 pointer-events-none">
          <div
            ref={barRef}
            className="h-full origin-left bg-gradient-to-r from-[#FF4500] to-[#D4AF37]"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        {/* 4. Overlay de diagnostic secret (affiché UNIQUEMENT si ?debug=1) */}
        {isDebug && (
          <aside
            id="debug-overlay"
            aria-label="Diagnostic de vol"
            className="fixed bottom-3 left-3 z-50 bg-black/90 text-[#39FF14] text-[11px] p-3 rounded-lg border border-[#39FF14]/40 font-mono shadow-2xl backdrop-blur-md pointer-events-none max-w-xs leading-snug"
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-white border-b border-white/20 pb-1 mb-1.5 flex items-center justify-between">
              <span>DEBUG VOL FPV</span>
              <span className="text-[#39FF14] animate-pulse">● LIVE</span>
            </div>
            <div>Frame : <span className="text-white font-bold">{diagInfo.drawnIdx}</span> / {diagInfo.frameCount} (cible: {diagInfo.targetIdx})</div>
            <div>Chargées : <span className="text-white font-bold">{diagInfo.loadedCount}</span> / {diagInfo.frameCount} ({diagInfo.frameCount ? Math.round((diagInfo.loadedCount / diagInfo.frameCount) * 100) : 0}%)</div>
            <div>Set : <span className="text-amber-300">{diagInfo.variantName}</span></div>
            <div>Connexion : <span className="text-cyan-300">{diagInfo.connType}</span></div>
            <div>Erreur : <span className={diagInfo.lastError === 'aucune' ? 'text-emerald-400' : 'text-rose-400 font-bold'}>{diagInfo.lastError}</span></div>
          </aside>
        )}
      </div>
    </section>
  );
};
