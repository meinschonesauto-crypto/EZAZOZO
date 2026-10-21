import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { FlyThroughCanvas } from './components/FlyThroughCanvas';
import { MenuSection } from './components/MenuSection';
import { BarSection } from './components/BarSection';
import { SpacesSection } from './components/SpacesSection';
import { ServicesSection } from './components/ServicesSection';
import { ReservationModule } from './components/ReservationModule';
import { OrderModule } from './components/OrderModule';
import { InfosSection } from './components/InfosSection';
import { Footer } from './components/Footer';
import { WhatsAppFAB } from './components/WhatsAppFAB';
import { Preloader } from './components/Preloader';

export const App: React.FC = () => {
  // Animation d'entrée au défilement des sections et gestion sans faille des sauts d'ancre
  useEffect(() => {
    document.body.classList.add('js-reveal');
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const revealElement = (el: HTMLElement) => {
      el.classList.add('is-visible');
      observer.unobserve(el);
    };

    // Révèle tous les éléments situés au-dessus ou dans la zone visible
    const checkVisibleAndAbove = () => {
      const vh = window.innerHeight;
      targets.forEach((el) => {
        if (!el.classList.contains('is-visible')) {
          const rect = el.getBoundingClientRect();
          // Tout élément déjà traversé ou visible dans le viewport est révélé
          if (rect.top <= vh + 80) {
            revealElement(el);
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight) {
            revealElement(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 100px 0px' }
    );

    targets.forEach((el) => observer.observe(el));

    // Révéler immédiatement les sections ciblées lors d'un saut d'ancre ou changement de hash
    const handleHashOrJump = (targetId?: string) => {
      const id = targetId || window.location.hash.replace('#', '');
      if (!id) {
        checkVisibleAndAbove();
        return;
      }
      const targetEl = document.getElementById(id);
      if (targetEl) {
        // Révéler tous les éléments au-dessus et à l'intérieur de la cible
        targets.forEach((el) => {
          const comp = el.compareDocumentPosition(targetEl);
          const isBeforeOrEqual = (comp & Node.DOCUMENT_POSITION_FOLLOWING) || el === targetEl || targetEl.contains(el);
          if (isBeforeOrEqual) {
            revealElement(el);
          }
        });
      }
      checkVisibleAndAbove();
    };

    // Écoute des clics sur tous les liens d'ancre internes
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href^="#"]');
      if (target) {
        const href = target.getAttribute('href');
        if (href && href.length > 1) {
          handleHashOrJump(href.slice(1));
        }
      }
    };

    window.addEventListener('scroll', checkVisibleAndAbove, { passive: true });
    window.addEventListener('hashchange', () => handleHashOrJump(), { passive: true });
    document.addEventListener('click', handleAnchorClick, { passive: true });

    // Vérification initiale et après chargement des polices / images
    handleHashOrJump();
    const t1 = setTimeout(checkVisibleAndAbove, 300);
    const t2 = setTimeout(checkVisibleAndAbove, 1200);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkVisibleAndAbove);
      window.removeEventListener('hashchange', () => handleHashOrJump());
      document.removeEventListener('click', handleAnchorClick);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F2EB] selection:bg-[#FF4500] selection:text-white relative">
      {/* Preloader élégant & skippable */}
      <Preloader />

      {/* Sticky Header */}
      <Header />

      <main id="main-content">
        {/* Centrepiece: Continuous First-Person Fly-Through */}
        <FlyThroughCanvas />

        {/* Section 1: Notre Braise & Poissons */}
        <MenuSection />

        {/* Section 2: La Cave, Le Bar & Douceurs */}
        <BarSection />

        {/* Section 3: Nos Espaces (VIP 8 places & Terrasse) */}
        <SpacesSection />

        {/* Section 4: Services & Confort */}
        <ServicesSection />

        {/* Section 5: Module Interactif de Réservation (WhatsApp) */}
        <ReservationModule />

        {/* Section 6: Module Interactif de Commande (Livraison / À emporter) */}
        <OrderModule />

        {/* Section 7: Infos Pratiques, Horaires & Plan d'accès */}
        <InfosSection />
      </main>

      {/* Bouton persistant WhatsApp sur mobile */}
      <WhatsAppFAB />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
