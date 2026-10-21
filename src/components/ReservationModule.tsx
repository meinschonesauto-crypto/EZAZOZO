import React, { useState } from 'react';

export const ReservationModule: React.FC = () => {
  const [space, setSpace] = useState<'standard' | 'vip'>('standard');
  const [date, setDate] = useState<string>('');
  const [slot, setSlot] = useState<string>('Dîner (19h00 - 21h30)');
  const [exactTime, setExactTime] = useState<string>('20:00');
  const [tables, setTables] = useState<number>(1);
  const [chairs, setChairs] = useState<number>(4);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const handleSpaceChange = (newSpace: 'standard' | 'vip') => {
    setSpace(newSpace);
    if (newSpace === 'vip' && chairs > 8) {
      setChairs(8);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date) {
      setError('Veuillez sélectionner une date de visite.');
      return;
    }
    if (!name.trim()) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!phone.trim()) {
      setError('Veuillez indiquer votre numéro WhatsApp.');
      return;
    }
    if (space === 'vip' && chairs > 8) {
      setError('L’espace VIP est strictement plafonné à 8 personnes assises.');
      return;
    }

    const spaceLabel = space === 'vip' ? 'Espace VIP Privatif (Salon 8 places)' : 'Espace Standard (Terrasse couverte)';

    const message = 
      `*DEMANDE DE RÉSERVATION — EZAZOZO*\n\n` +
      `👤 *Nom :* ${name.trim()}\n` +
      `📞 *Téléphone :* ${phone.trim()}\n` +
      `🏛️ *Espace :* ${spaceLabel}\n` +
      `📅 *Date :* ${date}\n` +
      `⏰ *Créneau & Heure :* ${slot} à ${exactTime}\n` +
      `🪑 *Configuration :* ${tables} table(s), ${chairs} convive(s)\n\n` +
      `_Message généré via le site officiel EZAZOZO (Agoé Assiyéyé, Lomé). Merci de me confirmer la disponibilité._`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/22890003921?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <section id="reserver" className="py-16 sm:py-24 bg-[#0D0D0D] border-t border-white/5 relative">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF4500]/15 border border-[#FF4500]/40 rounded-full text-[10px] sm:text-[11px] font-bold text-[#FF6B35] tracking-widest uppercase mb-2.5">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Réservation Directe WhatsApp
          </div>
          <h2 className="font-display h-section font-bold text-white tracking-wide">
            Réserver Votre Table
          </h2>
          <p className="font-accent italic text-[15px] sm:text-base text-[#F5F2EB]/70 mt-2">
            Terrasse couverte pavée ou salon VIP feutré à 8 places assises.
          </p>
        </div>

        {/* Card Form Mobile First */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-8 md:p-12 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* 1. Espace selection */}
            <div>
              <label className="block text-[11px] sm:text-xs uppercase tracking-widest font-bold text-[#D4AF37] mb-2.5">
                1. Choisissez Votre Espace
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => handleSpaceChange('standard')}
                  className={`min-h-[52px] p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    space === 'standard'
                      ? 'bg-[#FF4500]/15 border-[#FF4500] text-white shadow-lg'
                      : 'bg-black/40 border-white/10 text-[#F5F2EB]/70 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-sm sm:text-base font-bold text-white">Espace Standard</span>
                    {space === 'standard' && <span className="w-2 h-2 bg-[#FF4500] rounded-full" />}
                  </div>
                  <p className="text-[11px] sm:text-sm text-[#F5F2EB]/75 leading-relaxed">
                    Terrasse couverte pavée &bull; Ambiance conviviale &bull; Vue sur grill
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSpaceChange('vip')}
                  className={`min-h-[52px] p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    space === 'vip'
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-lg'
                      : 'bg-black/40 border-white/10 text-[#F5F2EB]/70 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-sm sm:text-base font-bold text-white">Salon VIP Privatif</span>
                    <span className="text-[9px] uppercase font-bold text-[#D4AF37] px-2 py-0.5 bg-[#D4AF37]/20 rounded">
                      Max 8 places
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-[#F5F2EB]/75 leading-relaxed">
                    Salon feutré climatisé &bull; Art textile géométrique &bull; Discrétion
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Date and Time inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                  Date de visite *
                </label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF4500]"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                  Créneau de service *
                </label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF4500]"
                >
                  <option value="Déjeuner (12h00 - 15h00)">Déjeuner (12h00 - 15h00)</option>
                  <option value="Dîner (19h00 - 21h30)">Dîner (19h00 - 21h30)</option>
                  <option value="Soirée nocturne (21h30 - 00h00)">Soirée nocturne (21h30 - 00h00)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                  Heure précise
                </label>
                <input
                  type="time"
                  value={exactTime}
                  onChange={(e) => setExactTime(e.target.value)}
                  className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF4500]"
                />
              </div>
            </div>

            {/* 3. Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                  Nombre de tables
                </label>
                <select
                  value={tables}
                  onChange={(e) => setTables(Number(e.target.value))}
                  className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF4500]"
                >
                  <option value={1}>1 table</option>
                  <option value={2}>2 tables</option>
                  <option value={3}>3 tables</option>
                  <option value={4}>4 tables (Groupe)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/80">
                    Nombre de chaises / convives
                  </label>
                  {space === 'vip' && (
                    <span className="text-[10px] text-[#D4AF37] font-semibold">Plafond strict : 8</span>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  max={space === 'vip' ? 8 : 40}
                  value={chairs}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (space === 'vip' && val > 8) {
                      setChairs(8);
                    } else {
                      setChairs(val);
                    }
                  }}
                  className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF4500]"
                />
              </div>
            </div>

            {/* 4. Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                  Nom &amp; Prénom *
                </label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF4500]"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/80 mb-1.5">
                  Numéro WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="+228 90 XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full min-h-[48px] bg-black/50 border border-white/15 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#FF4500]"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 bg-[#FF4500]/15 border border-[#FF4500]/50 rounded-xl text-xs text-[#FF8A5B] flex items-center gap-2.5 animate-fadeIn"
              >
                <svg className="w-5 h-5 shrink-0 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-[#F5F2EB]/60 text-center sm:text-left">
                <p className="text-[#D4AF37]">
                  Votre demande ouvre WhatsApp avec le récapitulatif pré-rempli.
                </p>
                <p className="text-white/40 mt-0.5">
                  La réservation sera confirmée directement par l'équipe d'EZAZOZO.
                </p>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto min-h-[50px] px-8 py-3.5 text-xs uppercase tracking-widest font-bold text-white bg-gradient-to-r from-[#FF4500] to-[#E05A2B] hover:brightness-110 shadow-lg shadow-[#FF4500]/25 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.19-.556-1.748-.72-2.887-2.483-2.973-2.597-.086-.114-.707-.941-.707-1.794s.448-1.27.607-1.442c.16-.172.347-.215.463-.215.116 0 .232.001.333.006.106.005.25.04.387.37.144.346.491 1.198.535 1.284.043.086.073.187.014.302-.058.115-.087.187-.174.288-.086.101-.182.226-.26.304-.087.086-.178.18-.077.353.101.173.448.74 0.96 1.197.66.587 1.216.769 1.389.855.173.086.275.072.376-.044.101-.115.433-.504.55-.677.115-.173.231-.144.389-.086.16.058 1.011.477 1.184.564.173.086.289.13.333.202.043.072.043.418-.101.823z" />
                </svg>
                <span>Envoyer via WhatsApp</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
