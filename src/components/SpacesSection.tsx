import React from 'react';
import { EZAZOZO_CONTENT } from '../data/content';

export const SpacesSection: React.FC = () => {
  const { spaces } = EZAZOZO_CONTENT;

  const scrollToReserver = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="espaces" className="py-20 sm:py-28 bg-[#0D0D0D] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16" data-reveal>
          <p className="kicker text-[#FF8A5B] justify-center">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Atmosphère &amp; Cadre
          </p>
          <h2 className="font-display h-section font-bold text-white tracking-wide mt-3">
            Nos Espaces d’Accueil
          </h2>
          <p className="lead font-accent italic text-[#F5F2EB]/75 mt-3 mx-auto">
            De la vaste terrasse pavée sous la brise nocturne au salon exclusif VIP garni d'art textile géométrique
            ouest-africain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {spaces.map((space) => {
            const isVip = space.id === 'vip';

            return (
              <article
                key={space.id}
                data-reveal
                className={`bg-[#141414] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  isVip
                    ? 'border-[#D4AF37]/40 hover:border-[#D4AF37]'
                    : 'border-white/10 hover:border-[#FF4500]/40'
                }`}
              >
                <div>
                  {/* Photo */}
                  <div className="relative h-64 sm:h-72 overflow-hidden bg-black/40">
                    <img
                      src={space.image}
                      alt={space.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                    <span
                      className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md ${
                        isVip
                          ? 'bg-black/80 border border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-black/80 border border-white/20 text-[#F5F2EB]'
                      }`}
                    >
                      {space.capacity}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-8">
                    <h3 className="font-display text-2xl font-bold text-white mb-2">{space.name}</h3>
                    <p className="font-accent italic text-xs text-[#D4AF37] mb-3">
                      {space.atmosphere}
                    </p>
                    <p className="text-sm text-[#F5F2EB]/80 leading-relaxed font-sans mb-5">
                      {space.description}
                    </p>

                    {/* Features list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-white/5">
                      {space.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#F5F2EB]/75">
                          <svg className="w-3.5 h-3.5 text-[#FF4500] shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 pt-0">
                  <a
                    href="#reserver"
                    onClick={scrollToReserver}
                    className={`btn w-full !min-h-[48px] ${isVip ? 'btn-gold' : 'btn-ember'}`}
                  >
                    {isVip ? 'Réserver l’Espace VIP (8 places)' : 'Réserver sur la Terrasse'}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
