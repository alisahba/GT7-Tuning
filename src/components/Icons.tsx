import type { ReactNode, SVGProps } from 'react';

const Svg = ({ children, ...p }: SVGProps<SVGSVGElement> & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
);

export const IconCheck = () => <Svg><path d="m5 12 5 5 9-10" /></Svg>;
export const IconX = () => <Svg><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const IconArrow = () => <Svg><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IconBack = () => <Svg><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const IconCopy = () => <Svg><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Svg>;
export const IconLink = () => <Svg><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Svg>;
export const IconPrint = () => <Svg><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></Svg>;
export const IconRain = () => <Svg><path d="M7 15a5 5 0 1 1 9.6-2H18a3 3 0 0 1 0 6H8" /><path d="M8 21l1-2M12 21l1-2M16 21l1-2" /></Svg>;
export const IconSun = () => <Svg><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const IconMoon = () => <Svg><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Svg>;
export const IconReverse = () => <Svg><path d="M4 7h13l-3-3M20 17H7l3 3" /></Svg>;
export const IconWarn = () => <Svg><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5M12 18h.01" /></Svg>;
export const IconReset = () => <Svg><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Svg>;
export const IconStar = ({ filled }: { filled?: boolean }) => (
  <Svg fill={filled ? 'currentColor' : 'none'}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></Svg>
);
export const IconGarage = () => <Svg><path d="M3 10 12 4l9 6v10H3z" /><path d="M7 20v-6h10v6M7 17h10" /></Svg>;
export const IconSettings = () => <Svg><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Svg>;
export const IconSave = () => <Svg><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></Svg>;
export const IconTrash = () => <Svg><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>;
export const IconEdit = () => <Svg><path d="M4 20h4L19 9l-4-4L4 16z" /></Svg>;
export const IconLock = () => <Svg><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>;
export const IconTrophy = () => <Svg><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6v4H9z" /></Svg>;
export const IconStopwatch = () => <Svg><circle cx="12" cy="14" r="7" /><path d="M12 14V10M10 2h4M18.5 6.5l1.5-1.5" /></Svg>;
export const IconFlag = () => <Svg><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Svg>;
export const IconFuel = () => <Svg><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10" /><path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-3-3" /></Svg>;
export const IconDrift = () => <Svg><path d="M3 18c4 0 5-6 9-6s5 6 9 6" /><path d="M3 12c3 0 4-4 7-4" opacity=".6" /><circle cx="17" cy="7" r="2" /></Svg>;
export const IconBolt = () => <Svg><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></Svg>;
