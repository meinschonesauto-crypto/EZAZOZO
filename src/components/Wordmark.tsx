import React from 'react';

interface WordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Wordmark: React.FC<WordmarkProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-2">
        {/* Primal West-African Ember & Fish Flame Icon */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isSm ? 'w-5 h-5' : isLg ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-6 h-6'}
          aria-hidden="true"
        >
          {/* Flame Embers */}
          <path
            d="M16 2C16 2 20 8 20 14C20 17.5 17.5 20 16 21C14.5 20 12 17.5 12 14C12 8 16 2 16 2Z"
            fill="url(#emberGrad)"
          />
          {/* Stylized Fish Arc & Ember Grate */}
          <path
            d="M5 24C9 20 23 20 27 24C22 27 10 27 5 24Z"
            fill="#D4AF37"
          />
          <circle cx="16" cy="14" r="2.5" fill="#FFF275" opacity="0.9" />
          <defs>
            <linearGradient id="emberGrad" x1="12" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B35" />
              <stop offset="0.6" stopColor="#FF4500" />
              <stop offset="1" stopColor="#B32400" />
            </linearGradient>
          </defs>
        </svg>

        {/* Brand Typographic Wordmark */}
        <span
          className={`font-brand tracking-[0.15em] sm:tracking-[0.18em] font-extrabold text-white uppercase ${
            isSm ? 'text-lg' : isLg ? 'text-2xl sm:text-3xl' : 'text-xl'
          }`}
        >
          EZA<span className="text-[#FF4500]">ZOZO</span>
        </span>
      </div>

      {showSubtitle && (
        <span
          className={`font-sans text-[#D4AF37] tracking-[0.20em] uppercase font-semibold mt-0.5 ${
            isSm ? 'text-[9px]' : isLg ? 'text-[10px] sm:text-xs' : 'text-[10px]'
          }`}
        >
          Haute Braise &bull; Lomé
        </span>
      )}
    </div>
  );
};
