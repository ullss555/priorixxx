import React from 'react';

interface PriorixLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  inverted?: boolean;
}

export const PriorixLogo: React.FC<PriorixLogoProps> = ({
  size = 'md',
  showTagline = true,
  inverted = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center space-x-3 select-none">
      {/* Modern PRIORIX Vector Polygon / Delta Logo Mark */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0 relative overflow-hidden`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5/6 h-5/6"
        >
          <path
            d="M12 3L21 19H3L12 3Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M12 7L18 17.5H6L12 7Z"
            fill="url(#logo-grad)"
          />
          <defs>
            <linearGradient id="logo-grad" x1="12" y1="7" x2="12" y2="17.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" />
              <stop offset="1" stopColor="#4338CA" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <div className="flex items-center space-x-2">
          <span
            className={`font-black tracking-wider ${textSizes[size]} ${
              inverted ? 'text-white' : 'text-slate-900'
            }`}
          >
            PRIORIX
          </span>
        </div>
        {showTagline && (
          <p
            className={`text-[10px] tracking-tight font-medium ${
              inverted ? 'text-indigo-300' : 'text-indigo-600'
            }`}
          >
            Prioritize smarter. Resolve faster.
          </p>
        )}
      </div>
    </div>
  );
};
