import React from 'react';
import { EZAZOZO_CONTENT } from '../data/content';

export const InfosSection: React.FC = () => {
  const { restaurant } = EZAZOZO_CONTENT;

  return (
    <section id="infos" className="py-24 sm:py-32 relative overflow-hidden bg-[#0D0D0D]">
      {/* Arrière-plan cinématique : reveal-still (vue d'ensemble aérienne au crépuscule) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/reveal-still.webp"
          alt="Vue d'ensemble d'EZAZOZO au crépuscule à Agoé Assiyéyé"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.08] saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/75 to-[#0D0D0D]/90" />
        <div className="absolute inset-0 pointer-events-none grain" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16" data-reveal>
          <p className="kicker text-[#D4AF37] justify-center">
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            Nous trouver
          </p>
          <h2 className="font-display h-section font-bold text-white tracking-wide mt-3">
            Infos Pratiques &amp; Accès
          </h2>
          <p className="lead font-accent italic text-[#F5F2EB]/80 mt-3 mx-auto">
            À Agoé Assiyéyé, au cœur de la vie togolaise, à proximité de la station Total Minamadou.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Horaires */}
          <div
            data-reveal
            className="bg-[#141414]/90 backdrop-blur-md border border-white/10 rounded-2xl p-7 sm:p-8 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FF4500]/15 border border-[#FF4500]/30 flex items-center justify-center text-[#FF4500] mb-5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Horaires d’Ouverture</h3>
              <p className="text-sm font-semibold text-[#FF8A5B] mb-2">{restaurant.hours}</p>
              <p className="text-sm text-[#F5F2EB]/75 leading-relaxed">
                Service continu du déjeuner jusqu’à minuit : braise minute, dîner, traiteur et soirées lounge.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/10">
              <span className="text-xs text-[#D4AF37] font-semibold">Tous les jours sans interruption</span>
            </div>
          </div>

          {/* Card 2: Localisation */}
          <div
            data-reveal
            className="bg-[#141414]/90 backdrop-blur-md border border-white/10 rounded-2xl p-7 sm:p-8 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Adresse &amp; Repères</h3>
              <p className="text-sm text-[#F5F2EB]/85 leading-relaxed mb-3">
                {restaurant.addressDisplay}
              </p>
              <p className="text-sm text-[#A8E6CF] leading-relaxed">
                Parking gratuit et sécurisé le long de la voie. Accès PMR et fauteuil roulant de plain-pied.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/10">
              <span className="text-xs text-[#A8E6CF] font-semibold">Parking surveillé gratuit</span>
            </div>
          </div>

          {/* Card 3: Contact & WhatsApp */}
          <div
            data-reveal
            className="bg-[#141414]/90 backdrop-blur-md border border-white/10 rounded-2xl p-7 sm:p-8 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] mb-5">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.19-.556-1.748-.72-2.887-2.483-2.973-2.597-.086-.114-.707-.941-.707-1.794s.448-1.27.607-1.442c.16-.172.347-.215.463-.215.116 0 .232.001.333.006.106.005.25.04.387.37.144.346.491 1.198.535 1.284.043.086.073.187.014.302-.058.115-.087.187-.174.288-.086.101-.182.226-.26.304-.087.086-.178.18-.077.353.101.173.448.74 0.96 1.197.66.587 1.216.769 1.389.855.173.086.275.072.376-.044.101-.115.433-.504.55-.677.115-.173.231-.144.389-.086.16.058 1.011.477 1.184.564.173.086.289.13.333.202.043.072.043.418-.101.823z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Ligne Directe</h3>
              <p className="text-sm text-[#F5F2EB]/80 leading-relaxed mb-4">
                Téléphone &amp; WhatsApp : <span className="font-bold text-white block mt-0.5">{restaurant.phone}</span>
              </p>
            </div>
            <div className="pt-4 mt-4">
              <a
                href={restaurant.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full !bg-[#25D366] hover:brightness-110 !text-white shadow-lg shadow-[#25D366]/20"
              >
                <span>Échanger sur WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
