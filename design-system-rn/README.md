# QuestHome Design System — React Native (Expo)

Carpeta autocontenida con todo el sistema de diseño de **QuestHome** listo para
copiarse a un proyecto Expo + TypeScript. Pensado para usarse con
**NativeWind v4**, manteniendo paridad de clases (`bg-primary`, `text-points`,
`text-streak`…) con el proyecto web.

---

## 📦 Estructura

```
design-system-rn/
├── tokens/         ← objetos JS planos (colors, typography, spacing, radius, shadows)
├── theme/          ← global.css + tailwind.config.js + ThemeProvider
├── fonts/          ← hook useAppFonts() con DM Sans + JetBrains Mono
├── components/     ← Button, GameBadge, StatCard, TaskCard, RewardCard, XpProgress
└── examples/       ← HomeScreen.example.tsx (pantalla demo)
```

---

## 🚀 Instalación paso a paso

### 1. Crear proyecto Expo (si aún no existe)

```bash
npx create-expo-app@latest mi-app -t expo-template-blank-typescript
cd mi-app
```

### 2. Copiar la carpeta

Copia toda la carpeta `design-system-rn/` a la raíz de tu proyecto (o dentro de
`src/`). El path no importa mientras lo apuntes en `tailwind.config.js`.

### 3. Instalar dependencias

```bash
npx expo install expo-font \
  @expo-google-fonts/dm-sans \
  @expo-google-fonts/jetbrains-mono \
  react-native-reanimated

npm install nativewind tailwindcss@^3.4.17
```

### 4. Configurar NativeWind

**`tailwind.config.js`** (raíz) — copia el contenido de
`design-system-rn/theme/tailwind.config.js` o reexpórtalo:

```js
module.exports = require("./design-system-rn/theme/tailwind.config.js");
```

**`global.css`** (raíz) — copia `design-system-rn/theme/global.css` y impórtalo
en `App.tsx`:

```tsx
import "./global.css";
```

**`babel.config.js`**:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

**`metro.config.js`**:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

**`nativewind-env.d.ts`** (raíz):

```ts
/// <reference types="nativewind/types" />
```

### 5. Cargar fuentes y montar el ThemeProvider

**`App.tsx`**:

```tsx
import "./global.css";
import React from "react";
import { ThemeProvider } from "./design-system-rn/theme/ThemeProvider";
import { useAppFonts } from "./design-system-rn/fonts/useAppFonts";
import HomeScreen from "./design-system-rn/examples/HomeScreen.example";

export default function App() {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider initialMode="system">
      <HomeScreen />
    </ThemeProvider>
  );
}
```

¡Listo! Ya tienes el design system funcionando.

---

## 🧩 Uso de los componentes

```tsx
import {
  GameBadge, StatCard, TaskCard, RewardCard, XpProgress, Button,
} from "./design-system-rn/components";

<GameBadge type="streak" value={7} label="días" />
<XpProgress level={4} currentXp={320} requiredXp={500} />
<TaskCard title="Sacar la basura" points={20} status="pending" />
<RewardCard title="Hora extra" cost={500} userPoints={1240} />
<Button label="Crear tarea" variant="primary" onPress={...} />
```

Todos los componentes aceptan la prop `style` para overrides puntuales y usan
**clases Tailwind semánticas** (no colores hardcodeados).

---

## 🌗 Modo oscuro

`ThemeProvider` resuelve el esquema (`system` por defecto) y se sincroniza con
NativeWind para que `dark:bg-card`, `dark:text-foreground`, etc., funcionen
automáticamente.

```tsx
const { scheme, mode, setMode, toggle, tokens } = useTheme();
```

- `scheme` — `"light" | "dark"` realmente aplicado.
- `tokens` — el mapa HSL del esquema activo (útil con `StyleSheet`).

---

## 🎨 Tokens disponibles

| Categoría     | Token                                       | Ejemplo                  |
|---------------|---------------------------------------------|--------------------------|
| Marca         | `primary`, `secondary`, `accent`            | `bg-primary`             |
| Gamificación  | `xp`, `streak`, `points`                    | `text-streak`            |
| Estado        | `success`, `warning`, `destructive`         | `bg-warning/15`          |
| Superficies   | `background`, `card`, `surface`, `surface-elevated` | `bg-card`        |
| Texto         | `foreground`, `muted-foreground`            | `text-muted-foreground`  |
| Bordes        | `border`, `input`, `ring`                   | `border-border`          |

Tipografías:

| Clase                | Familia                |
|----------------------|------------------------|
| `font-sans`          | DM Sans Regular        |
| `font-sans-medium`   | DM Sans Medium         |
| `font-sans-semibold` | DM Sans SemiBold       |
| `font-sans-bold`     | DM Sans Bold           |
| `font-mono`          | JetBrains Mono Regular |
| `font-mono-bold`     | JetBrains Mono Bold    |

---

## ✅ Checklist de integración

- [ ] Carpeta `design-system-rn/` copiada al proyecto.
- [ ] `tailwind.config.js` apunta a `design-system-rn/**/*.{ts,tsx}`.
- [ ] `global.css` importado en `App.tsx`.
- [ ] `babel.config.js` y `metro.config.js` configurados con NativeWind.
- [ ] Fuentes cargadas con `useAppFonts()` antes de renderizar la app.
- [ ] `<ThemeProvider>` envolviendo la app.
- [ ] La pantalla `HomeScreen.example.tsx` se ve correctamente.

---

## 🔄 Mantener sincronizado con la web

Si actualizas un token de color, actualízalo en **dos sitios**:

1. `theme/global.css` (variables CSS para NativeWind).
2. `tokens/colors.ts` (objetos JS para StyleSheet / lógica).

Idealmente ambos archivos se generan desde una única fuente (un `tokens.json`
con un script de build), pero mantenerlos a mano funciona bien para empezar.

---

## ❓ FAQ

**¿Puedo usar este sistema sin NativeWind?**
Sí. Los `tokens/` son objetos JS planos: úsalos con `StyleSheet.create({...})`
pasando `hsl(light.primary)` como `backgroundColor`. La API de props de los
componentes no cambia, solo reescribes `className` → `style`.

**¿Funciona con Tamagui o Restyle?**
Sí: importa los `tokens/` y mapéalos al sistema de temas de tu librería.

**¿Cómo añado animaciones tipo `points-pop` y `pulse-glow`?**
Instala `react-native-reanimated` (ya está en las deps) y usa `withSpring` /
`withRepeat`. La versión actual omite animaciones para mantener cero
dependencias extras.