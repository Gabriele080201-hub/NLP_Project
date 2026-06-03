import React from 'react';

interface FoppaLogoProps {
  variant?: 'blue' | 'white';
  tagline?: boolean;
  layout?: 'stacked' | 'horizontal';
  /** px height of the egg-cup symbol; everything scales from it */
  size?: number;
}

/**
 * Foppa brand lockup — faithful port of the design-system FoppaLogo.
 * Egg-cup goblet symbol + Fredoka wordmark + tracked red "Taste Supporter".
 */
export default function FoppaLogo({
  variant = 'blue',
  tagline = true,
  layout = 'horizontal',
  size = 40,
}: FoppaLogoProps) {
  const fg = variant === 'white' ? '#FFFFFF' : '#045BA9';
  const red = variant === 'white' ? '#FFFFFF' : '#D2342E';
  const stacked = layout === 'stacked';
  const wm = size * 1.02;
  const tag = wm * 0.205;

  return (
    <div
      role="img"
      aria-label="Foppa — Taste Supporter"
      className="select-none"
      style={{
        display: 'inline-flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? 0 : size * 0.28,
      }}
    >
      <svg
        width={size * 0.72}
        height={size}
        viewBox="0 0 100 140"
        fill={fg}
        aria-hidden="true"
        style={{ display: 'block', flex: 'none' }}
      >
        <path d="M50,6 C66,6 80,24 80,50 C80,62 78,69 75,73 L25,73 C22,69 20,62 20,50 C20,24 34,6 50,6 Z" />
        <path d="M22,77 L78,77 C79,86 78,90 71,96 C63,102 59,104 58,110 C57,118 64,123 69,131 C70,134 66,136 61,136 L39,136 C34,136 30,134 31,131 C36,123 43,118 42,110 C41,104 37,102 29,96 C22,90 21,86 22,77 Z" />
      </svg>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: stacked ? 'center' : 'flex-start',
          marginTop: stacked ? -wm * 0.17 : 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600,
            color: fg,
            fontSize: wm,
            lineHeight: 1,
            letterSpacing: '-0.045em',
          }}
        >
          foppa
        </span>
        {tagline && (
          <span
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontWeight: 700,
              color: red,
              fontSize: tag,
              letterSpacing: '0.295em',
              textTransform: 'uppercase',
              paddingLeft: '0.295em',
              marginTop: wm * 0.12,
              opacity: variant === 'white' ? 0.95 : 1,
            }}
          >
            Taste&nbsp;Supporter
          </span>
        )}
      </div>
    </div>
  );
}
