import React from 'react';
import { EZAZOZO_CONTENT, type MenuItem } from '../data/content';
import { addToCart } from '../lib/cart';

interface MenuSectionProps {
  onSelectItem?: (item: MenuItem) => void;
}

/** Visuel d'un plat : vraie photo si elle existe, sinon carte stylée (jamais d'image cassée). */
export const ItemVisual: React.FC<{ item: MenuItem; className?: string; glyph?: string }> = ({ item, className = '', glyph }) => {
  const [failed, setFailed] = React.useState(false);
  if (item.image && !failed) {
    return (
      <img
        src={item.image}
        alt={item.imageAlt ?? item.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`card-art w-full h-full flex items-end p-4 ${className}`} aria-hidden="true">
      <span className="font-display text-4xl font-bold text-[#F5F2EB]/15 leading-none select-none">
        {glyph ?? item.name.charAt(0)}
      </span>
    </div>
  );
};

export const MenuSection: React.FC<MenuSectionProps> = ({ onSelectItem }) => {
  const { menu } = EZAZOZO_CONTENT;

  const order = (item: MenuItem, scroll: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(item.id);
    onSelectItem?.(item);
    if (scroll) document.getElementById('commander')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="braise" className="py-20 sm:py-28 bg-[#0D0D0D] relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16" data-reveal>
          <p className="kicker text-[#FF8A5B] justify-center">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            L’âme d’EZAZOZO
          </p>
          <h2 className="h-section font-display font-bold text-white mt-3">Notre Braise au Feu de Bois</h2>
          <p className="lead font-accent italic text-[#F5F2EB]/75 mt-4 mx-auto">
            Poissons entiers marinés aux aromates, saisis sur braises de palétuvier et nappés de notre relish
            tomate-oignon fraîchement pilée.
          </p>
        </div>

        {/* Poissons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-14">
          {menu.fish.map((fish) => (
            <article
              key={fish.id}
              data-reveal
              className="group bg-[#141414] border border-white/10 hover:border-[#FF4500]/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col"
            >
              <div className="relative h-56 sm:h-64 overflow-hidden bg-black/40">
                <ItemVisual item={fish} className="group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                {fish.badge && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-[#0D0D0D]/80 backdrop-blur-md border border-[#D4AF37]/40 rounded-full text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase">
                    {fish.badge}
                  </span>
                )}
              </div>
              <div className="p-5 sm:p-6 flex-1">
                <h3 className="h-card font-display font-bold text-white mb-2">{fish.name}</h3>
                <p className="text-sm text-[#F5F2EB]/75 leading-relaxed">{fish.description}</p>
              </div>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                <span className="text-xs text-[#A8E6CF]">FCFA · {fish.priceNote}</span>
                <a href="#commander" onClick={order(fish, true)} className="btn btn-ember !min-h-[44px] !px-4">
                  Commander
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Accompagnements */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 sm:p-10" data-reveal>
          <div className="mb-6 sm:mb-8">
            <p className="kicker text-[#D4AF37]">Les garnitures</p>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2">Accompagnements du terroir</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {menu.sides.map((side) => (
              <div key={side.id} className="bg-black/40 border border-white/5 rounded-xl overflow-hidden flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ItemVisual item={side} />
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  <h4 className="font-display text-sm sm:text-base font-bold text-white leading-snug">{side.name}</h4>
                  <p className="hidden sm:block text-sm text-[#F5F2EB]/70 leading-relaxed mt-1.5">{side.description}</p>
                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#A8E6CF]">{side.priceNote}</span>
                    <button
                      type="button"
                      onClick={order(side, false)}
                      className="tap-glow inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-lg text-[11px] uppercase tracking-wider text-[#FF8A5B] font-bold hover:text-white"
                      aria-label={`Ajouter ${side.name} au panier`}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
