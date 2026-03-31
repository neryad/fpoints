export const zIndex = {
  base: 0,
  content: 10,
  header: 20,
  dropdown: 30,
  modal: 40,
  toast: 50,
  overlay: 60,
} as const;

export type ZIndex = typeof zIndex;
