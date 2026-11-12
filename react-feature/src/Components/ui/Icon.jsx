// Line icons used across the redesigned UI. They inherit the current text color,
// so color them with CSS `color`. Decorative by default (aria-hidden); give the
// surrounding button an aria-label when the icon is its only content.

const STROKE_ICONS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  home: <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  feed: <><rect x="4" y="4" width="16" height="6" rx="1.5" /><rect x="4" y="14" width="16" height="6" rx="1.5" /></>,
  message: <path d="M5 5h14v10H9l-4 4z" />,
  music: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  star: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />,
  logout: <><path d="M10 5H5v14h5" /><path d="M14 8l4 4-4 4M18 12H9" /></>,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></>,
  volume: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  volumeOff: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></>,
  download: <><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" /><path d="M5 19h14" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  trash: <><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></>,
  chart: <path d="M5 19V11M12 19V5M19 19v-6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></>,
};

const FILL_ICONS = {
  play: <path d="M8 5.5v13l11-6.5z" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
  more: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
};

function Icon({ name, size = 20, strokeWidth = 1.8, className = '', ...rest }) {
  const filled = FILL_ICONS[name];
  const shape = filled || STROKE_ICONS[name];
  if (!shape) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {shape}
    </svg>
  );
}

export default Icon;
