import React from 'react';
import { EZAZOZO_CONTENT } from '../data/content';
import { ItemVisual } from './MenuSection';

export const BarSection: React.FC = () => {
  const { menu } = EZAZOZO_CONTENT;

  return (
    <section id="cave" className="py-20 sm:py-28 bg-[#0A0A0A] border-t border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-5" data-reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-full text-[11px] font-bold text-[#D4AF37] tracking-widest uppercase mb-4">
              <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
              Fraîcheur &amp; Sélection
            </div>
            <h2 className="font-display h-section font-bold text-white tracking-wide leading-tight mb-4">
              Le Bar, La Cave &amp; Douceurs
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#F5F2EB]/80 leading-relaxed mb-6">
              Pour accompagner l’ardeur de nos poissons braisés, notre bar propose les grandes bières togolaises servies
              à température glacée, une cave à vin tempérée pour les accords élégants, ainsi que des cocktails signatures
              élaborés aux agrumes et racines locales.
            </p>
            <div className="p-4 bg-[#141414] border-l-2 border-[#D4AF37] rounded-r text-sm text-[#F5F2EB]/90 mb-6 font-accent italic">
              « Une Awooyo ou une Beaufort bien frappée sur la terrasse pavée, ou un rouge d'expression dans le salon
              VIP : à chacun son rythme. »
            </div>
            <a
              href="#reserver"
              className="btn btn-gold"
            >
              <span>Réserver une table au lounge</span>
            </a>
          </div>

          {/* Right Cards Column */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {menu.drinks.concat(menu.desserts).map((drink) => (
              <div
                key={drink.id}
                data-reveal
                className="bg-[#141414] border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col"
              >
                <div className="relative h-40 sm:h-44 overflow-hidden">
                  <ItemVisual item={drink} glyph={drink.category === 'desserts' ? 'D' : drink.name.charAt(0)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                </div>
                <div className="p-5 sm:p-6 pt-3">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                      {drink.category === 'desserts' ? 'Douceur' : 'Boisson'}
                    </span>
                    <span className="text-[11px] text-[#A8E6CF]">{drink.priceNote}</span>
                  </div>
                  <h3 className="h-card font-display font-bold text-white mb-2">{drink.name}</h3>
                  <p className="text-sm text-[#F5F2EB]/75 leading-relaxed font-sans">
                    {drink.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
