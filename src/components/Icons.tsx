import type { ReactNode, SVGProps } from 'react';

const Svg = ({ children, ...p }: SVGProps<SVGSVGElement> & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
);

export const IconSearch = () => <Svg><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const IconCheck = () => <Svg><path d="m5 12 5 5 9-10" /></Svg>;
export const IconArrow = () => <Svg><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IconBack = () => <Svg><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const IconCopy = () => <Svg><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Svg>;
export const IconLink = () => <Svg><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Svg>;
export const IconPrint = () => <Svg><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></Svg>;
export const IconRain = () => <Svg><path d="M7 15a5 5 0 1 1 9.6-2H18a3 3 0 0 1 0 6H8" /><path d="M8 21l1-2M12 21l1-2M16 21l1-2" /></Svg>;
export const IconSun = () => <Svg><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const IconReverse = () => <Svg><path d="M4 7h13l-3-3M20 17H7l3 3" /></Svg>;
export const IconWarn = () => <Svg><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5M12 18h.01" /></Svg>;
export const IconReset = () => <Svg><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Svg>;

export const IconStopwatch = () => <Svg><circle cx="12" cy="14" r="7" /><path d="M12 14V10M10 2h4M18.5 6.5l1.5-1.5" /></Svg>;
export const IconFlag = () => <Svg><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Svg>;
export const IconFuel = () => <Svg><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10" /><path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-3-3" /></Svg>;
export const IconDrift = () => <Svg><path d="M3 18c4 0 5-6 9-6s5 6 9 6" /><path d="M3 12c3 0 4-4 7-4" opacity=".6" /><circle cx="17" cy="7" r="2" /></Svg>;
export const IconBolt = () => <Svg><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></Svg>;
