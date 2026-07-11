import {create} from "zustand";

interface UIState {
  commandOpen: boolean;
  assistantOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
  setAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
}

/** Global UI state for the command palette and the assistant panel. */
export const useUI = create<UIState>((set) => ({
  commandOpen: false,
  assistantOpen: false,
  setCommandOpen: (open) => set({commandOpen: open}),
  toggleCommand: () => set((state) => ({commandOpen: !state.commandOpen})),
  setAssistantOpen: (open) => set({assistantOpen: open}),
  toggleAssistant: () => set((state) => ({assistantOpen: !state.assistantOpen})),
}));
