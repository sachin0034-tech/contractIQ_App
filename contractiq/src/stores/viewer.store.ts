import { create } from 'zustand';

/** Cross-component navigation state shared by the key terms panel, chat citations and the document viewers. */
interface ViewerState {
  /** 1-indexed page to show, or null when nothing has been selected. */
  targetPage: number | null;
  /** Sentence to highlight on the target page. */
  highlightText: string | null;
  /** Key term whose row is currently selected. */
  highlightTermId: string | null;
  /** Increments on every goTo so selecting the same page again still triggers the scroll. */
  navKey: number;
  goTo: (page: number, text?: string | null, termId?: string | null) => void;
  clear: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  targetPage: null,
  highlightText: null,
  highlightTermId: null,
  navKey: 0,
  goTo: (page, text = null, termId = null) =>
    set((state) => ({ targetPage: page, highlightText: text, highlightTermId: termId, navKey: state.navKey + 1 })),
  clear: () => set({ targetPage: null, highlightText: null, highlightTermId: null }),
}));
