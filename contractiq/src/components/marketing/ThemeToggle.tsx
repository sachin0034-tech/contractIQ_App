'use client';

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const isDark =
      root.dataset.theme === 'dark' ||
      (!root.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = isDark ? 'light' : 'dark';
  }

  return (
    <button className="tbtn sm" onClick={toggle} aria-label="Toggle theme" type="button">
      ◐
    </button>
  );
}