import React from 'react';

export default function FoppaLogo() {
  return (
    <svg
      width="120"
      height="40"
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      {/* Egg Cup Icon at the top middle */}
      <g transform="translate(48, 2)">
        {/* Egg */}
        <path
          d="M 6 0 C 1 0 0 5 0 8 C 0 11 1.5 13 6 13 C 10.5 13 12 11 12 8 C 12 5 11 0 6 0 Z"
          fill="#1565C0"
        />
        {/* Cup base & stand */}
        <path
          d="M 0 11 C 1 14 3 15 3 16 L 3 18 L 1 18 L 1 19 L 11 19 L 11 18 L 9 18 L 9 16 C 9 15 11 14 12 11 Z"
          fill="#1565C0"
        />
      </g>

      {/* Main FOPPA text */}
      <text
        x="6"
        y="30"
        fontFamily='"IBM Plex Sans", sans-serif'
        fontWeight="bold"
        fontSize="21"
        letterSpacing="-0.5px"
        fill="#1565C0"
      >
        foppa
      </text>

      {/* Subtitle: taste supporter */}
      <text
        x="8"
        y="38"
        fontFamily='"IBM Plex Sans", sans-serif'
        fontWeight="800"
        fontSize="6.5"
        letterSpacing="2.8"
        fill="#C62828"
      >
        TASTE SUPPORTER
      </text>
    </svg>
  );
}
