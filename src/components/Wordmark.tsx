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

  return (
    <div className={`inline-flex flex-col items-start justify-center select-none ${className}`}>
      <div className="flex items-center gap-2 leading-none">
        {/* Primal West-African Ember & Fish Flame Icon */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isSm ? 'w-4.5 h-4.5 shrink-0' : 'w-5 h-5 shrink-0'}
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
          className={`font-brand tracking-[0.14em] font-extrabold text-white uppercase whitespace-nowrap leading-none ${
            isSm ? 'text-[0.98rem]' : 'text-[1.08rem]'
          }`}
        >
          EZA<span className="text-[#FF4500]">ZOZO</span>
        </span>
      </div>

      {showSubtitle && (
        <span
          className={`font-sans text-[#D4AF37] tracking-[0.16em] uppercase font-semibold mt-1 whitespace-nowrap leading-none ${
            isSm ? 'text-[8px]' : 'text-[8.75px]'
          }`}
        >
          Haute Braise &bull; Lomé
        </span>
      )}
    </div>
  );
};
