// Небольшой набор SVG-иконок. Цвет берётся из CSS (currentColor).

function StrokeIcon({ size = 20, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ShieldIcon({ size }) {
  return (
    <StrokeIcon size={size}>
      <path d="M12 3l7.5 2.8v5.4c0 4.7-3.1 8.4-7.5 9.8-4.4-1.4-7.5-5.1-7.5-9.8V5.8L12 3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </StrokeIcon>
  );
}

export function GitBranchIcon({ size }) {
  return (
    <StrokeIcon size={size}>
      <circle cx="6" cy="5.5" r="2.2" />
      <circle cx="6" cy="18.5" r="2.2" />
      <circle cx="18" cy="8.5" r="2.2" />
      <path d="M6 7.7v8.6" />
      <path d="M18 10.7c0 4.3-12 2.5-12 5.6" />
    </StrokeIcon>
  );
}

export function SearchIcon({ size }) {
  return (
    <StrokeIcon size={size}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </StrokeIcon>
  );
}

export function ChecklistIcon({ size }) {
  return (
    <StrokeIcon size={size}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" />
    </StrokeIcon>
  );
}

export function BookIcon({ size }) {
  return (
    <StrokeIcon size={size}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" />
      <path d="M8.5 7.5h7" />
    </StrokeIcon>
  );
}

export function GitHubIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
