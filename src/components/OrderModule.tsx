import React, { useState, useEffect } from 'react';
import { EZAZOZO_CONTENT, type MenuItem } from '../data/content';
import { CART_ADD_EVENT } from '../lib/cart';

export const OrderModule: React.FC = () => {
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [address, setAddress] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [orderError, setOrderError] = useState<string>('');

  // Cart: item ID -> quantity, initialisé vide (le panier flottant n'apparaît qu'au premier ajout)
  const [cart, setCart] = useState<Record<string, number>>({});

  const allItems: MenuItem[] = [
    ...EZAZOZO_CONTENT.menu.fish,
    ...EZAZOZO_CONTENT.menu.sides,
    ...EZAZOZO_CONTENT.menu.drinks,
    ...EZAZOZO_CONTENT.menu.desserts
  ];

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev: Record<string, number>) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    });
  };

  const cartEntries = Object.entries(cart);
  const totalItemCount = cartEntries.reduce((acc, [, qty]: [string, number]) => acc + qty, 0);

  // Écoute des ajouts au panier depuis les autres sections (Notre Braise, Le Bar)
  useEffect(() => {
    const handleAdd = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const id = customEvent.detail;
      if (id) {
        updateQuantity(id, 1);
      }
    };
    window.addEventListener(CART_ADD_EVENT, handleAdd);
    return () => window.removeEventListener(CART_ADD_EVENT, handleAdd);
  }, []);

  // Synchronisation avec l'attribut HTML pour ajuster la position du bouton flottant WhatsApp
  useEffect(() => {
    document.documentElement.setAttribute('data-cart', totalItemCount > 0 ? 'open' : 'closed');
  }, [totalItemCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    if (totalItemCount === 0) {
      setOrderError('Veuillez ajouter au moins un plat à votre sélection avant d’envoyer la commande.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError('Veuillez renseigner votre nom et votre numéro WhatsApp pour la confirmation.');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setOrderError('Veuillez préciser votre adresse de livraison à Lomé.');
      return;
    }

    const itemsSummary = cartEntries
      .map(([id, qty]) => {
        const item = allItems.find((i) => i.id === id);
        return item ? `• ${qty}x ${item.name} (${item.priceNote})` : '';
      })
      .filter(Boolean)
      .join('\n');

    const typeLabel = orderType === 'delivery' ? 'Livraison à domicile (Lomé)' : 'À emporter (sur place à Agoé Assiyéyé)';

    const message =
      `*NOUVELLE COMMANDE — EZAZOZO*\n\n` +
      `👤 *Client :* ${customerName.trim()}\n` +
      `📞 *Téléphone :* ${customerPhone.trim()}\n` +
      `📦 *Mode :* ${typeLabel}\n` +
      (orderType === 'delivery' ? `📍 *Adresse de livraison :* ${address.trim()}\n` : '') +
      (specialInstructions.trim() ? `📝 *Notes :* ${specialInstructions.trim()}\n` : '') +
      `\n🛒 *Articles sélectionnés :*\n${itemsSummary}\n\n` +
      `_Devise : Francs CFA (FCFA) — Montant total à confirmer par le restaurant selon pesée du poisson._\n` +
      `_Message généré via le site web officiel EZAZOZO Lomé._`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/22890003921?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <section id="commander" className="py-20 sm:py-28 bg-[#0A0A0A] border-t border-white/5 relative">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16" data-reveal>
          <p className="kicker text-[#FF8A5B] justify-center">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Service à emporter &bull; Livraison
          </p>
          <h2 className="font-display h-section font-bold text-white tracking-wide mt-3">
            Commander Vos Grillades
          </h2>
          <p className="lead font-accent italic text-[#F5F2EB]/70 mt-3 mx-auto">
            Préparé minute à la commande, emballage soigné préservant la chaleur, livraison rapide dans tout Lomé.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Menu Items Picker (Mobile first single column) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8" data-reveal>
            {/* 1. Poissons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base sm:text-lg font-bold text-white">
                  1. Poissons Braisés au Feu de Bois
                </h3>
                <span className="text-xs text-[#D4AF37] font-semibold">Garnis de relish</span>
              </div>
              <div className="space-y-3">
                {EZAZOZO_CONTENT.menu.fish.map((fish) => {
                  const qty = cart[fish.id] || 0;
                  return (
                    <div
                      key={fish.id}
                      className="p-3.5 sm:p-4 bg-[#141414] border border-white/10 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-xs sm:text-sm font-bold text-white truncate">
                          {fish.name}
                        </h4>
                        <span className="text-[11px] text-[#A8E6CF] block mt-0.5">
                          {fish.priceNote}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(fish.id, -1)}
                            className="min-h-[44px] min-w-[44px] rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold text-base cursor-pointer"
                            aria-label={`Diminuer ${fish.name}`}
                          >
                            -
                          </button>
                        )}
                        <span className="w-6 text-center text-xs sm:text-sm font-bold text-white">
                          {qty > 0 ? qty : 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(fish.id, 1)}
                          className="min-h-[44px] min-w-[44px] rounded-lg bg-[#FF4500] text-white hover:bg-[#FF5722] flex items-center justify-center font-bold text-base cursor-pointer"
                          aria-label={`Ajouter ${fish.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Accompagnements */}
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white mb-3">
                2. Accompagnements du Terroir
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EZAZOZO_CONTENT.menu.sides.map((side) => {
                  const qty = cart[side.id] || 0;
                  return (
                    <div
                      key={side.id}
                      className="p-3.5 bg-[#141414] border border-white/10 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-xs sm:text-sm font-bold text-white truncate">
                          {side.name}
                        </h4>
                        <span className="text-[11px] text-[#A8E6CF] block">{side.priceNote}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(side.id, -1)}
                            className="min-h-[44px] min-w-[44px] rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
                            aria-label={`Diminuer ${side.name}`}
                          >
                            -
                          </button>
                        )}
                        <span className="w-5 text-center text-xs font-bold text-white">
                          {qty > 0 ? qty : 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(side.id, 1)}
                          className="min-h-[44px] min-w-[44px] rounded-lg bg-[#D4AF37] text-black hover:bg-[#E8C872] flex items-center justify-center font-bold text-sm cursor-pointer"
                          aria-label={`Ajouter ${side.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Boissons & Douceurs */}
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white mb-3">
                3. Boissons Fraîches &amp; Douceurs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EZAZOZO_CONTENT.menu.drinks.concat(EZAZOZO_CONTENT.menu.desserts).map((drink) => {
                  const qty = cart[drink.id] || 0;
                  return (
                    <div
                      key={drink.id}
                      className="p-3.5 bg-[#141414] border border-white/10 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-xs sm:text-sm font-bold text-white truncate">
                          {drink.name}
                        </h4>
                        <span className="text-[11px] text-[#A8E6CF] block">{drink.priceNote}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(drink.id, -1)}
                            className="min-h-[44px] min-w-[44px] rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
                            aria-label={`Diminuer ${drink.name}`}
                          >
                            -
                          </button>
                        )}
                        <span className="w-5 text-center text-xs font-bold text-white">
                          {qty > 0 ? qty : 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(drink.id, 1)}
                          className="min-h-[44px] min-w-[44px] rounded-lg bg-white/15 text-white hover:bg-white/25 flex items-center justify-center font-bold text-sm cursor-pointer"
                          aria-label={`Ajouter ${drink.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form & Cart Panel */}
          <div className="lg:col-span-5" data-reveal>
            <div id="details-commande" className="bg-[#141414] border border-[#D4AF37]/30 rounded-2xl p-5 sm:p-7 sticky top-24 shadow-2xl">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-3.5 pb-2.5 border-b border-white/10 flex items-center justify-between">
                <span>Votre Panier</span>
                <span className="text-xs font-bold text-[#D4AF37]">
                  {totalItemCount} article(s)
                </span>
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Mode toggle */}
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                    Mode de commande
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-black/50 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={`min-h-[44px] py-2 text-xs uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                        orderType === 'delivery'
                          ? 'bg-[#FF4500] text-white shadow-md'
                          : 'text-[#F5F2EB]/60 hover:text-white'
                      }`}
                    >
                      Livraison Lomé
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('takeaway')}
                      className={`min-h-[44px] py-2 text-xs uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                        orderType === 'takeaway'
                          ? 'bg-[#FF4500] text-white shadow-md'
                          : 'text-[#F5F2EB]/60 hover:text-white'
                      }`}
                    >
                      À emporter
                    </button>
                  </div>
                </div>

                {/* Delivery Address */}
                {orderType === 'delivery' && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                      Adresse de livraison à Lomé *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Quartier Tokoin, près de..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-2.5 text-base text-white focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                )}

                {/* Contact */}
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-2.5 text-base text-white focus:outline-none focus:border-[#FF4500]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                    Téléphone WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="+228 90 XX XX XX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-2.5 text-base text-white focus:outline-none focus:border-[#FF4500]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                    Instructions particulières
                  </label>
                  <input
                    type="text"
                    placeholder="Piment à part, cuisson très croustillante..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-2.5 text-base text-white focus:outline-none focus:border-[#FF4500]"
                  />
                </div>

                {/* Summary Box */}
                <div className="p-3.5 bg-black/40 rounded-lg border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#F5F2EB]/70">
                    <span>Plats au panier :</span>
                    <span className="font-bold text-white">{totalItemCount}</span>
                  </div>
                  <div className="flex justify-between text-[#F5F2EB]/70">
                    <span>Devise :</span>
                    <span className="font-bold text-[#D4AF37]">Francs CFA (FCFA)</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-[#A8E6CF]">
                    <span>Montant estimé :</span>
                    <span>prix à confirmer</span>
                  </div>
                  <p className="text-[11px] text-white/50 pt-1 leading-tight">
                    * Pesée du poisson frais du jour confirmée par l'équipe sur WhatsApp.
                  </p>
                </div>

                {/* Bannière d'erreur inline accessible (remplace alert() natif) */}
                {orderError && (
                  <div
                    role="alert"
                    className="p-3.5 mb-4 bg-[#FF4500]/15 border border-[#FF4500]/50 rounded-xl text-xs text-[#FF8A5B] flex items-center gap-2.5 animate-fadeIn"
                  >
                    <svg className="w-5 h-5 shrink-0 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium leading-relaxed">{orderError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={totalItemCount === 0}
                  className={`btn btn-ember w-full !min-h-[50px] cursor-pointer ${
                    totalItemCount === 0 ? 'opacity-40 !cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.19-.556-1.748-.72-2.887-2.483-2.973-2.597-.086-.114-.707-.941-.707-1.794s.448-1.27.607-1.442c.16-.172.347-.215.463-.215.116 0 .232.001.333.006.106.005.25.04.387.37.144.346.491 1.198.535 1.284.043.086.073.187.014.302-.058.115-.087.187-.174.288-.086.101-.182.226-.26.304-.087.086-.178.18-.077.353.101.173.448.74 0.96 1.197.66.587 1.216.769 1.389.855.173.086.275.072.376-.044.101-.115.433-.504.55-.677.115-.173.231-.144.389-.086.16.058 1.011.477 1.184.564.173.086.289.13.333.202.043.072.043.418-.101.823z" />
                  </svg>
                  <span>Commander via WhatsApp</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Cart Bar (Phone ergonomics) */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#141414]/95 backdrop-blur-xl border-t border-white/15 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_25px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 animate-fadeIn">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
              <span className="text-xs font-bold text-white font-display">
                {totalItemCount} {totalItemCount > 1 ? 'articles' : 'article'}
              </span>
            </div>
            <span className="text-[11px] text-[#A8E6CF] block">
              Total : prix à confirmer (FCFA)
            </span>
          </div>

          <a
            href="#details-commande"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('details-commande');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn btn-ember !min-h-[44px] !px-4 !py-2 !text-xs shrink-0"
          >
            <span>Voir panier</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      )}
    </section>
  );
};
