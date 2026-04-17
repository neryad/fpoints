const baseShadowColor = "#1F1E24";

export const shadow = {
  level0: {
    shadowColor: baseShadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  level1: {
    shadowColor: baseShadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },

  level2: {
    shadowColor: baseShadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },

  level3Down: {
    shadowColor: baseShadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },

  level3Up: {
    shadowColor: baseShadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

export type Shadow = typeof shadow;
