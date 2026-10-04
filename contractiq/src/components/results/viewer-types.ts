import type { ContractPage } from '@/types/domain';

/** Shared contract for both document viewers: any navigation that works in one must work in the other. */
export interface ViewerProps {
  pages: ContractPage[];
  /** 1-indexed page to show, or null. */
  targetPage: number | null;
  /** Sentence to highlight on the target page. */
  highlightText: string | null;
  /** Changes on every navigation request so selecting the same page again re-triggers the scroll. */
  navKey: number;
  /** Called when the user presses Escape inside the viewer to clear the highlight. */
  onClearHighlight: () => void;
}

/** Scrolls `container` so `element` is near the top, without moving the rest of the page. */
export function scrollToElement(container: HTMLElement, element: HTMLElement, offset = 8): void {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const containerTop = container.getBoundingClientRect().top;
  const elementTop = element.getBoundingClientRect().top;
  container.scrollTo({
    top: container.scrollTop + (elementTop - containerTop) - offset,
    behavior: reduce ? 'auto' : 'smooth',
  });
}
