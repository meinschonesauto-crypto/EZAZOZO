import React, { useEffect, useState } from 'react';
import { EZAZOZO_CONTENT } from '../data/content';

export const WhatsAppFAB: React.FC = () => {
  // Masqué au tout premier écran (scroll < 180px) pour éviter tout chevauchement avec les boutons "La carte" et "Réserver"
  const [hiddenAtTop, setHiddenAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const isTop = window.scrollY < 180;
      setHiddenAtTop(isTop);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <aside
      aria-label="Contact rapide WhatsApp"
      className={`wa-fab lg:hidden pointer-events-auto ${hiddenAtTop ? 'is-hidden' : ''}`}
    >
      <a
        href={EZAZOZO_CONTENT.restaurant.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Réserver directement sur WhatsApp"
        className="group flex items-center gap-2 min-h-[46px] px-3.5 py-2 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:brightness-110 active:scale-95 transition-all text-xs font-bold tracking-wider uppercase"
      >
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.19-.556-1.748-.72-2.887-2.483-2.973-2.597-.086-.114-.707-.941-.707-1.794s.448-1.27.607-1.442c.16-.172.347-.215.463-.215.116 0 .232.001.333.006.106.005.25.04.387.37.144.346.491 1.198.535 1.284.043.086.073.187.014.302-.058.115-.087.187-.174.288-.086.101-.182.226-.26.304-.087.086-.178.18-.077.353.101.173.448.74 0.96 1.197.66.587 1.216.769 1.389.855.173.086.289.13.333.202.043.072.043.418-.101.823z" />
        </svg>
        <span className="hidden sm:inline">Réserver WhatsApp</span>
        <span className="sm:hidden">WhatsApp</span>
      </a>
    </aside>
  );
};
