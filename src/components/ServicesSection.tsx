import React from 'react';
import { EZAZOZO_CONTENT } from '../data/content';

export const ServicesSection: React.FC = () => {
  const { services } = EZAZOZO_CONTENT.restaurant;

  const icons: Record<string, React.ReactNode> = {
    terrasse: (
      <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    takeaway: (
      <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    delivery: (
      <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    parking: (
      <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    pmr: (
      <svg className="w-6 h-6 text-[#A8E6CF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  };

  return (
    <section id="services" className="py-20 sm:py-28 bg-[#0A0A0A] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16" data-reveal>
          <p className="kicker text-[#D4AF37] justify-center">
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
            Votre confort
          </p>
          <h2 className="font-display h-section font-bold text-white tracking-wide mt-3">
            Services &amp; Commodités
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              data-reveal
              className="bg-[#141414] border border-white/10 hover:border-white/20 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-start"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shrink-0">
                {icons[svc.id] || icons.terrasse}
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">{svc.label}</h3>
              <p className="text-sm text-[#F5F2EB]/75 leading-relaxed font-sans">
                {svc.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
