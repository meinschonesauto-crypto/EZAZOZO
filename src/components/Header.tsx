import React, { useState, useEffect, useRef } from 'react';
import { Wordmark } from './Wordmark';
import { EZAZOZO_CONTENT } from '../data/content';

interface HeaderProps {
  onNavigate?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const burgerBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Piège à focus, touche Échap, verrouillage de défilement et restitution du focus
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

      // Met le focus sur le bouton de fermeture
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
      // Révèle immédiatement tous les éléments traversés jusqu'à la section ciblée
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10 shadow-2xl py-2 sm:py-2.5'
            : 'bg-gradient-to-b from-[#0D0D0D]/90 via-[#0D0D0D]/60 to-transparent py-2.5 sm:py-4'
        }`}
        style={{ paddingTop: 'max(0.45rem, env(safe-area-inset-top))' }}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Wordmark (Compact on mobile) */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center min-h-[44px] py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500] rounded"
          >
            <span className="sm:hidden flex items-center">
              <Wordmark size="sm" showSubtitle={false} />
            </span>
            <span className="hidden sm:flex items-center">
              <Wordmark size="md" showSubtitle={true} />
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => handleLinkClick('braise')}
              className="text-sm font-medium text-[#F5F2EB]/80 hover:text-white transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Notre Braise
            </button>
            <button
              onClick={() => handleLinkClick('cave')}
              className="text-sm font-medium text-[#F5F2EB]/80 hover:text-white transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              La Cave &amp; Bar
            </button>
            <button
              onClick={() => handleLinkClick('espaces')}
              className="text-sm font-medium text-[#F5F2EB]/80 hover:text-white transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Nos Espaces (VIP)
            </button>
            <button
              onClick={() => handleLinkClick('services')}
              className="text-sm font-medium text-[#F5F2EB]/80 hover:text-white transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Services
            </button>
            <button
              onClick={() => handleLinkClick('infos')}
              className="text-sm font-medium text-[#F5F2EB]/80 hover:text-white transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Infos &amp; Accès
            </button>
          </nav>

          {/* Action CTAs (Mobile & Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Order Button on Desktop */}
            <button
              onClick={() => handleLinkClick('commander')}
              className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 text-xs uppercase tracking-wider font-semibold text-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 rounded transition-all cursor-pointer"
            >
              Commander
            </button>

            {/* Reservation Button: visible from 360px up to avoid overflow on 320px iPhone SE (reachable via drawer) */}
            <button
              onClick={() => handleLinkClick('reserver')}
              className="hidden min-[360px]:inline-flex items-center justify-center min-h-[44px] px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold text-white bg-gradient-to-r from-[#FF4500] to-[#E05A2B] hover:brightness-110 shadow-md shadow-[#FF4500]/25 rounded transition-all cursor-pointer"
            >
              Réserver
            </button>

            {/* Mobile Hamburger Drawer Trigger (44x44px touch target) */}
            <button
              ref={burgerBtnRef}
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-[#F5F2EB] p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Drawer (Accessibilité WAI-ARIA Dialog + Piège à focus) */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation principal"
          className="fixed inset-0 z-50 lg:hidden bg-[#0D0D0D] flex flex-col justify-between p-6 animate-fadeIn"
        >
          {/* Top Bar of Drawer */}
          <div className="flex items-center justify-between pt-safe pb-4 border-b border-white/10">
            <Wordmark size="md" showSubtitle={true} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
              aria-label="Fermer le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items (Touch friendly >= 48px height) */}
          <nav className="flex-1 flex flex-col justify-center space-y-4 py-6">
            <button
              onClick={() => handleLinkClick('visite')}
              className="flex items-center min-h-[48px] text-left text-xl font-display font-bold text-white hover:text-[#FF4500] transition-colors"
            >
              Le Vol FPV (Fly-through)
            </button>
            <button
              onClick={() => handleLinkClick('braise')}
              className="flex items-center min-h-[48px] text-left text-xl font-display font-bold text-white hover:text-[#FF4500] transition-colors"
            >
              Notre Braise &bull; Poissons
            </button>
            <button
              onClick={() => handleLinkClick('cave')}
              className="flex items-center min-h-[48px] text-left text-xl font-display font-bold text-white hover:text-[#FF4500] transition-colors"
            >
              La Cave &bull; Bières &bull; Cocktails
            </button>
            <button
              onClick={() => handleLinkClick('espaces')}
              className="flex items-center min-h-[48px] text-left text-xl font-display font-bold text-white hover:text-[#FF4500] transition-colors"
            >
              Nos Espaces (Salon VIP 8 places)
            </button>
            <button
              onClick={() => handleLinkClick('services')}
              className="flex items-center min-h-[48px] text-left text-xl font-display font-bold text-white hover:text-[#FF4500] transition-colors"
            >
              Services &amp; Parking Gratuit
            </button>
            <button
              onClick={() => handleLinkClick('infos')}
              className="flex items-center min-h-[48px] text-left text-xl font-display font-bold text-white hover:text-[#FF4500] transition-colors"
            >
              Infos Pratiques &amp; Localisation
            </button>
          </nav>

          {/* Bottom Action CTAs in Drawer */}
          <div className="space-y-3 pb-safe pt-4 border-t border-white/10">
            <button
              onClick={() => handleLinkClick('reserver')}
              className="w-full min-h-[50px] flex items-center justify-center text-center text-xs uppercase tracking-widest font-bold text-white bg-gradient-to-r from-[#FF4500] to-[#E05A2B] rounded-lg shadow-lg"
            >
              Réserver une table
            </button>
            <button
              onClick={() => handleLinkClick('commander')}
              className="w-full min-h-[50px] flex items-center justify-center text-center text-xs uppercase tracking-widest font-bold text-[#D4AF37] border border-[#D4AF37] rounded-lg"
            >
              Commander (Livraison / À emporter)
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
