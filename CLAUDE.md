# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Launch Expo dev server
npm run ios          # Run on iOS simulator (requires Xcode)
npm run android      # Run on Android emulator (requires Android SDK)
npm run web          # Run in browser

# EAS builds
eas build --platform ios
eas build --platform android
```

**No test runner or linter is configured.** TypeScript strict mode (`"strict": true`) is the primary correctness check.

## Environment setup

Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Architecture

React Native + Expo mobile app (iOS/Android/Web) backed entirely by Supabase (PostgreSQL + Auth + Storage). There is **no intermediate API layer** — the app calls Supabase directly via `@supabase/supabase-js`.

**Complex business logic lives in Supabase RPCs** (in `supabase/migrations/`):
- `get_my_points_balance(group_id)` — user's point balance
- `review_task_submission(submission_id, status)` — admin approval flow
- `request_reward_redemption(group_id, reward_id)` — redeem points
- `review_reward_redemption(redemption_id, status)` — approve redemptions

**Navigation flow:**
```
RootNavigator
├── AuthNavigator       (unauthenticated)
├── GroupNavigator      (authenticated but no active group)
└── MainTabsNavigator   (authenticated + group selected)
    ├── Home → HomeScreen, PointHistoryScreen
    ├── Tasks → TasksScreen, TaskDetailScreen, SubmitTaskScreen, CreateTaskScreen, ApprovalsScreen
    ├── Rewards → RewardsScreen, ManageRewardsScreen, MyRedemptionsScreen, RewardApprovalsScreen
    └── Profile → ProfileScreen
```

**Global state** is managed by `AppSessionProvider` (auth session + active group), persisted via AsyncStorage. Feature-level state uses custom hooks (`useTasks`, `useRewards`, `useGroups`, etc.).

**Role-based access** (owner / sub_owner / member) is enforced via Supabase RLS policies. Owner-only screens (approvals, reward management) are conditionally rendered based on membership role.

**Feature module structure** — every feature under `src/features/` follows:
```
feature/
  screens/     — React Native screen components
  services/    — Supabase calls (supabase.rpc / supabase.from)
  hooks/       — data fetching hooks
  types.ts     — TypeScript interfaces
```

## UI rules (from project style guide)

**All UI text must be in Spanish.**

### Theme — never hardcode values
```tsx
import { useTheme } from "src/core/theme/ThemeProvider";

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({ ... });
}
```

Semantic color tokens: `colors.background`, `colors.surface`, `colors.surfaceMuted`, `colors.text`, `colors.textStrong`, `colors.muted`, `colors.primary`, `colors.primaryText`, `colors.primarySoft`, `colors.success/successSoft`, `colors.warning/warningSoft`, `colors.error/errorSoft`, `colors.info/infoSoft`, `colors.border`, `colors.divider`, `colors.reward/rewardSoft`.

Spacing scale: `spacing[1]=4 … spacing[8]=40`. Font sizes: `xxs=11 xs=12 sm=14 base=16 lg=18 xl=22`. Radius: `xs=4 sm=8 md=12 lg=16 xl=20 full=999`.

### Component rules

- **Always `Pressable`, never `Button`** (React Native's `Button` is banned)
- Pressable feedback: `style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]}`
- `borderWidth: 0.5` on cards and inputs (never `1`)
- `placeholderTextColor={theme.colors.muted}` on every `TextInput`
- Loading: `<ActivityIndicator color={theme.colors.primary} />`, never a text spinner
- Wrap root tab screens in `<SafeAreaView edges={["top"]}>` from `react-native-safe-area-context`
- Wrap forms in `<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>` + `<ScrollView keyboardShouldPersistTaps="handled">`
- Always `useCallback` for async handlers and handlers passed as props

### TypeScript + StyleSheet dynamic styles
When mixing static `StyleSheet` styles with dynamic colors, use explicit types to avoid literal inference errors:
```tsx
import { type ViewStyle, type TextStyle } from "react-native";
let dotStyle: ViewStyle = s.baseDot;
dotStyle = { ...s.baseDot, backgroundColor: someColor }; // ✅
```

### Standard status config
```ts
const STATUS_CONFIG = {
  pending:  { label: "Pendiente", dotColor: "#F0872F", textColor: "#E5730A", bgColor: "#FFF3E6" },
  approved: { label: "Aprobado",  dotColor: "#4CCB86", textColor: "#26B765", bgColor: "#E6F7EF" },
  rejected: { label: "Rechazado", dotColor: "#D94A42", textColor: "#B3261E", bgColor: "#FDECEC" },
};
```
