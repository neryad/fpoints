# Fonts — DM Sans + JetBrains Mono

QuestHome uses **DM Sans** (UI) and **JetBrains Mono** (numbers, stats).

## Install once in your Expo project

```bash
npx expo install expo-font @expo-google-fonts/dm-sans @expo-google-fonts/jetbrains-mono
```

## Use in `App.tsx`

```tsx
import { useAppFonts } from "./design-system-rn/fonts/useAppFonts";

export default function App() {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null; // or your splash screen
  return /* … */;
}
```

After this, the family names exposed in `tokens/typography.ts`
(e.g. `DMSans_700Bold`) are available in `style={{ fontFamily: ... }}` and
through Tailwind classes like `font-sans`, `font-sans-bold`, `font-mono`.