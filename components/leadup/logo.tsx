export function Logo({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const textColor = dark ? '#FFFFFF' : '#1A7A5E';
  const arrowColor = '#1A7A5E';
  return (
    <svg
      viewBox="0 0 140 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LeadUp"
    >
      {/* L letter with integrated up arrow */}
      <rect x="2" y="4" width="4" height="24" rx="2" fill={dark ? '#34D399' : arrowColor} />
      <rect x="2" y="24" width="14" height="4" rx="2" fill={dark ? '#34D399' : arrowColor} />
      {/* Up arrow */}
      <path d="M22 14L26 6L30 14" stroke={dark ? '#34D399' : arrowColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="26" y1="6" x2="26" y2="28" stroke={dark ? '#34D399' : arrowColor} strokeWidth="3" strokeLinecap="round" />
      {/* Text */}
      <text x="38" y="24" fontFamily="var(--font-display), Inter, sans-serif" fontWeight="700" fontSize="20" fill={textColor} letterSpacing="-0.5">
        LeadUp
      </text>
    </svg>
  );
}
