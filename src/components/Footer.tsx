import React from 'react';
import { Wordmark } from './Wordmark';
import { EZAZOZO_CONTENT } from '../data/content';

export const Footer: React.FC = () => {
  const { restaurant } = EZAZOZO_CONTENT;

  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-20 sm:pb-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Wordmark size="lg" />
            <p className="font-accent italic text-sm text-[#F5F2EB]/75 mt-4 max-w-md leading-relaxed">
              « L’art ancestral de la braise au feu de palétuvier réinventé dans un lounge nocturne contemporain.
              Poissons d'exception, sauces fraîches pilées et accueil chaleureux au cœur d’Agoé Assiyéyé. »
            </p>
            <div className="flex items-center gap-3 mt-6">
              <span className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
                Lomé &bull; Togo &bull; Devises : Francs CFA (FCFA)
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-4">
              Navigation
            </h4>
            <ul className="space-y-1 text-sm text-[#F5F2EB]/70">
              <li>
                <a href="#visite" className="inline-flex items-center min-h-[44px] py-2 hover:text-white transition-colors">
                  Le Vol FPV (Fly-through)
                </a>
              </li>
              <li>
                <a href="#braise" className="inline-flex items-center min-h-[44px] py-2 hover:text-white transition-colors">
                  Notre Braise (Poissons &amp; Plats)
                </a>
              </li>
              <li>
                <a href="#cave" className="inline-flex items-center min-h-[44px] py-2 hover:text-white transition-colors">
                  Le Bar &amp; La Cave
                </a>
              </li>
              <li>
                <a href="#espaces" className="inline-flex items-center min-h-[44px] py-2 hover:text-white transition-colors">
                  Nos Espaces (Salon VIP)
                </a>
              </li>
              <li>
                <a href="#services" className="inline-flex items-center min-h-[44px] py-2 hover:text-white transition-colors">
                  Services &amp; Parking
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-4">
              Réservations &amp; Commandes
            </h4>
            <ul className="space-y-1 text-sm text-[#F5F2EB]/70">
              <li>
                <span className="text-white block font-semibold">{restaurant.hours}</span>
              </li>
              <li>
                <a
                  href={restaurant.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center min-h-[44px] py-2 text-[#25D366] hover:underline font-semibold"
                >
                  WhatsApp : {restaurant.phone}
                </a>
              </li>
              <li className="text-[#F5F2EB]/60 pt-2 leading-relaxed text-xs">{restaurant.addressDisplay}</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright avec mention discrète "Site de démonstration" */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F5F2EB]/40 gap-4">
          <p>&copy; {new Date().getFullYear()} EZAZOZO &mdash; Haute Braise &amp; Lounge Gastronomique. Tous droits réservés.</p>
          <p className="font-sans">Site de démonstration &bull; Agoé Assiyéyé, Lomé, Togo</p>
        </div>
      </div>
    </footer>
  );
};
