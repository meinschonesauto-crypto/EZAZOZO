import React, { useState, useEffect, useRef } from 'react';
import { Wordmark } from './Wordmark';
import { EZAZOZO_CONTENT } from '../data/content';

interface HeaderProps {
  onNavigate?: (id: string) => void;
}

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'menu', label: 'Menu' },
  { id: 'cave', label: 'Cave & Bar' },
  { id: 'espaces', label: 'Espaces' },
  { id: 'services', label: 'Services' },
  { id: 'infos', label: 'Infos' }
];

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const burgerBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Détection du scroll pour la transition de hauteur et d'arrière-plan
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Suivi de la section active pour le soulignement doré fin
  useEffect(() => {
    const sectionIds = ['menu', 'cave', 'espaces', 'services', 'infos'];
    const handleActive = () => {
      const scrollY = window.scrollY;
      const vhOffset = window.innerHeight * 0.35;
      const probe = scrollY + vhOffset;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (probe >= top) {
            setActiveSection(sectionIds[i]);
            return;
          }
        }
      }
      setActiveSection('');
    };

    window.addEventListener('scroll', handleActive, { passive: true });
    handleActive();
    return () => window.removeEventListener('scroll', handleActive);
  }, []);

  // Accessibilité WAI-ARIA pour le drawer mobile (Focus trap & Escape)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
          return;
        }
        if (e.key === 'Tab' && drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      const timer = setTimeout(() => {
        const closeBtn = drawerRef.current?.querySelector<HTMLElement>('button[aria-label="Fermer le menu"]');
        closeBtn?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    } else {
      document.body.style.overflow = '';
      burgerBtnRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  const handleLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    const target = document.getElementById(id);
    if (target) {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((node) => {
        const comp = node.compareDocumentPosition(target);
        if ((comp & Node.DOCUMENT_POSITION_FOLLOWING) || node === target || target.contains(node)) {
          node.classList.add('is-visible');
        }
      });
      target.scrollIntoView({ behavior: 'smooth' });
    }
    if (onNavigate) {
      onNavigate(id);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 header-container ${
          scrolled
            ? 'bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 shadow-2xl is-scrolled'
            : 'bg-gradient-to-b from-[#050505]/75 via-[#050505]/45 to-transparent border-b border-transparent'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 header-bar">
          {/* ZONE 1 : Logo / Wordmark (Gauche, largeur maîtrisée ~150-170px) */}
          <div className="flex items-center justify-start shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="EZAZOZO — Retour au début"
              className="flex items-center h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500] rounded"
            >
              <Wordmark size="md" showSubtitle={true} />
            </a>
          </div>

          {/* ZONE 2 : Navigation (Centrée, visible à partir de 1180px) */}
          <nav
            className="header-nav-desktop items-center justify-center"
            aria-label="Navigation principale"
          >
            <div className="flex items-center gap-7 xl:gap-8 whitespace-nowrap">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleLinkClick(item.id)}
                    className={`header-nav-link text-[12.5px] uppercase tracking-[0.14em] font-medium transition-colors cursor-pointer flex items-center h-[44px] ${
                      isActive ? 'is-active text-white' : 'text-[#F5F2EB]/90 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ZONE 3 : Actions (Droite, 44px de hauteur, 12px de gap) */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            {/* Bouton secondaire discret "Commander" (visible à >= 1180px) */}
            <button
              onClick={() => handleLinkClick('commander')}
              className="header-action-commander inline-flex items-center justify-center h-[44px] min-h-[44px] px-4 text-xs uppercase tracking-[0.14em] font-semibold text-[#F5F2EB] bg-transparent border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              Commander
            </button>

            {/* Bouton primaire "Réserver" (bouton plein braise unique) */}
            <button
              onClick={() => handleLinkClick('reserver')}
              className="inline-flex items-center justify-center h-[44px] min-h-[44px] px-5 text-xs uppercase tracking-[0.14em] font-bold text-white bg-gradient-to-r from-[#FF4500] to-[#E05A2B] hover:brightness-110 shadow-md shadow-[#FF4500]/25 rounded-lg active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              Réserver
            </button>

            {/* Bouton Hamburger mobile (visible < 1180px) */}
            <button
              ref={burgerBtnRef}
              onClick={() => setMobileMenuOpen(true)}
              className="header-burger-mobile inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-[#F5F2EB] p-2 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Tiroir mobile plein écran (accessibilité WAI-ARIA) */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation principal"
          className="fixed inset-0 z-50 lg:hidden bg-[#0D0D0D] flex flex-col justify-between p-6 animate-fadeIn"
        >
          {/* Haut du tiroir */}
          <div className="flex items-center justify-between pt-safe pb-4 border-b border-white/10">
            <Wordmark size="md" showSubtitle={true} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
              aria-label="Fermer le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Liens de navigation avec libellés épurés */}
          <nav className="flex-1 flex flex-col justify-center space-y-4 py-6">
            <button
              onClick={() => handleLinkClick('visite')}
              className="flex items-center min-h-[48px] text-left text-xl font-serif font-medium text-white hover:text-[#FF4500] transition-colors"
            >
              Le Vol FPV (Fly-through)
            </button>
            <button
              onClick={() => handleLinkClick('menu')}
              className="flex items-center min-h-[48px] text-left text-xl font-serif font-medium text-white hover:text-[#FF4500] transition-colors"
            >
              Menu &bull; Poissons &amp; Garnitures
            </button>
            <button
              onClick={() => handleLinkClick('cave')}
              className="flex items-center min-h-[48px] text-left text-xl font-serif font-medium text-white hover:text-[#FF4500] transition-colors"
            >
              Cave &amp; Bar
            </button>
            <button
              onClick={() => handleLinkClick('espaces')}
              className="flex items-center min-h-[48px] text-left text-xl font-serif font-medium text-white hover:text-[#FF4500] transition-colors"
            >
              Espaces &bull; Salon VIP 8 places
            </button>
            <button
              onClick={() => handleLinkClick('services')}
              className="flex items-center min-h-[48px] text-left text-xl font-serif font-medium text-white hover:text-[#FF4500] transition-colors"
            >
              Services &amp; Parking Gratuit
            </button>
            <button
              onClick={() => handleLinkClick('infos')}
              className="flex items-center min-h-[48px] text-left text-xl font-serif font-medium text-white hover:text-[#FF4500] transition-colors"
            >
              Infos Pratiques &amp; Accès
            </button>
          </nav>

          {/* Actions en bas du tiroir mobile */}
          <div className="space-y-3 pb-safe pt-4 border-t border-white/10">
            <button
              onClick={() => handleLinkClick('reserver')}
              className="w-full min-h-[50px] flex items-center justify-center text-center text-xs uppercase tracking-widest font-bold text-white bg-gradient-to-r from-[#FF4500] to-[#E05A2B] rounded-lg shadow-lg active:scale-98 transition-transform"
            >
              Réserver une table
            </button>
            <button
              onClick={() => handleLinkClick('commander')}
              className="w-full min-h-[50px] flex items-center justify-center text-center text-xs uppercase tracking-widest font-bold text-[#D4AF37] border border-[#D4AF37] rounded-lg active:scale-98 transition-transform"
            >
              Commander en ligne
            </button>
            <a
              href={EZAZOZO_CONTENT.restaurant.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] flex items-center justify-center text-xs text-[#25D366] font-semibold gap-2"
            >
              <span>WhatsApp : {EZAZOZO_CONTENT.restaurant.phone}</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
};
