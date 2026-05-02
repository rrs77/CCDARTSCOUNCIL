import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xs' | 'xs-sm';
  showText?: boolean;
  boldCurriculumDesigner?: boolean;
  /** Custom letters in logo circle, max 3 chars (e.g., "CCD") */
  letters?: string;
}

// Normalise logo letters: max 3 chars, uppercase
function normaliseLogoLetters(val: string | undefined): string {
  if (!val || typeof val !== 'string') return 'CCD';
  const s = val.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s || 'CCD';
}

// Main Logo Component - matches the shared design
export function Logo({ className = '', size = 'md', showText = true, boldCurriculumDesigner = false, letters }: LogoProps) {
  const sizeClasses: Record<string, { container: string; text: string; subtext: string; iconSize: number }> = {
    xs: { container: 'h-10 w-10', text: 'text-base', subtext: 'text-xs', iconSize: 40 },
    'xs-sm': { container: 'h-10 w-10 sm:h-12 sm:w-12', text: 'text-base', subtext: 'text-xs', iconSize: 40 },
    sm: { container: 'h-12 w-12', text: 'text-lg', subtext: 'text-xs', iconSize: 48 },
    md: { container: 'h-16 w-16', text: 'text-xl', subtext: 'text-sm', iconSize: 64 },
    lg: { container: 'h-20 w-20', text: 'text-2xl', subtext: 'text-base', iconSize: 80 }
  };

  const currentSize = sizeClasses[size] ?? sizeClasses.md;
  const displayLetters = normaliseLogoLetters(letters);
  const fontSize = displayLetters.length === 1 ? 36 : displayLetters.length === 2 ? 30 : 28;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* CCD Logo in Circle */}
      <div className={`${currentSize.container} flex-shrink-0 relative`}>
        <svg 
          viewBox="0 0 80 80" 
          className="w-full h-full"
          style={{ fill: 'none' }}
        >
          {/* Circular background with teal gradient */}
          <circle
            cx="40"
            cy="40"
            r="38"
            fill="url(#tealGradient)"
          />
          
          {/* CCD Text */}
          <text
            x="40"
            y="40"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            letterSpacing="-1"
          >
            {displayLetters}
          </text>
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#008272" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      {showText && (
          <h1 
          className={`font-bold text-black leading-tight whitespace-nowrap`}
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 700,
            fontSize: size === 'lg' ? '1.5rem' : size === 'md' ? '1.25rem' : '1.125rem'
            }}
          >
          <span>Creative </span>
          <span className={boldCurriculumDesigner ? "font-bold" : "font-normal"}>Curriculum Designer</span>
          </h1>
      )}
    </div>
  );
}

// Alias for backward compatibility
export const LogoSVG = Logo;
