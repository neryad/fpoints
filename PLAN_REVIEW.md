# Plan de resolución — Code Review fpoints

Estado: `[ ]` pendiente · `[x]` completado · `[~]` en progreso

---

## Etapa 1 — Seguridad y datos críticos
> Antes de cualquier deploy.

- [ ] **1.1** Rotar el JWT hardcodeado en la migración de push notifications y moverlo a `vault.secrets` / `current_setting()`
  - `supabase/migrations/20260407000002_push_notifications.sql`

- [ ] **1.2** Agregar `AsyncStorage` al cliente Supabase para persistir sesiones entre restarts
  - `src/core/supabase/client.ts`
  ```ts
  import AsyncStorage from "@react-native-async-storage/async-storage";
  createClient(url, key, {
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
  });
  ```

- [ ] **1.3** Guardar paths en lugar de signed URLs para `proof_image_url`
  - Nueva migración: renombrar columna a `proof_image_path`
  - `src/core/supabase/storage.service.ts`: retornar el path, no la signed URL
  - `src/features/tasks/services/tasks.service.ts`: generar la signed URL al momento de mostrar
  - Reescribir la política RLS `task_proof_manager_select` para usar paths

- [ ] **1.4** Agregar políticas RLS faltantes en `tasks` y `rewards`
  - Nueva migración con INSERT/UPDATE/DELETE requiriendo `role IN ('owner','sub_owner')`

---

## Etapa 2 — Bugs visibles para el usuario

- [ ] **2.1** Agregar `invite_code` al select de `listMyGroups` (1 línea)
  - `src/features/groups/services/groups.service.ts`
  - `.select("group_id, role, groups(id, name, invite_code, created_by, created_at)")`

- [ ] **2.2** Validar membresía activa en `AppSessionProvider` al hidratar desde AsyncStorage
  - `src/app/providers/AppSessionProvider.tsx`
  - Verificar que el usuario sigue siendo miembro del grupo antes de establecerlo como activo

- [ ] **2.3** `getMySubmissionStatusForTasks` debe re-throw el error en lugar de retornar `{}`
  - `src/features/tasks/services/tasks.service.ts`

- [ ] **2.4** Resolver `expo-notifications`: instalar dependencia y registrar push token, o eliminar el plugin de `app.json`
  - `app.json`, `package.json`
  - Si se implementa: `npx expo install expo-notifications expo-device`

- [ ] **2.5** Interceptor de `TOKEN_REFRESH_FAILED` — llamar `signOut()` cuando el token no se puede refrescar
  - `src/core/supabase/client.ts` o `src/app/providers/AppSessionProvider.tsx`

---

## Etapa 3 — UI / Layout

- [ ] **3.1** `SafeAreaView edges={["top"]}` faltante en 3 screens de tabs
  - `src/features/tasks/screens/TasksScreen.tsx`
  - `src/features/rewards/screens/RewardsScreen.tsx`
  - `src/features/profile/screens/ProfileScreen.tsx`

- [ ] **3.2** `borderWidth: 1` → `0.5` en los 4 archivos con `inputInvalid`
  - `src/features/auth/screens/LoginScreen.tsx:64`
  - `src/features/auth/screens/RegisterScreen.tsx:63`
  - `src/features/tasks/screens/CreateTaskScreen.tsx:62`
  - `src/features/tasks/screens/EditTaskScreen.tsx:67`

- [ ] **3.3** `MediaTypeOptions.Images` deprecado → `mediaTypes: ["images"]`
  - `src/features/tasks/screens/SubmitTaskScreen.tsx:221`

- [ ] **3.4** Flash blanco de `ThemeProvider` — renderizar con `colorScheme` default mientras hidrata
  - `src/core/theme/ThemeProvider.tsx`

- [ ] **3.5** `NavigationContainer` y `StatusBar` dinámicos según `isDark`
  - `src/app/App.tsx`

- [ ] **3.6** `as any` en progress bars → `DimensionValue`
  - `src/features/home/screens/HomeScreen.tsx:524,678`

---

## Etapa 4 — Arquitectura y manejo de errores

- [ ] **4.1** Centralizar `getCurrentUserId` en `src/core/supabase/auth.ts`
  - Reemplazar las 5 implementaciones duplicadas en: `groups.service.ts`, `tasks.service.ts`, `rewards.service.ts`, `streak.service.ts`, `profile.service.ts`

- [ ] **4.2** `try/catch/finally` en todos los `useCallback` async
  - `src/features/tasks/screens/SubmitTaskScreen.tsx`
  - `src/features/tasks/screens/TaskDetailScreen.tsx`
  - `src/features/rewards/screens/ManageRewardsScreen.tsx`
  - `src/features/profile/screens/ProfileScreen.tsx`

- [ ] **4.3** `ensureUserRow` debe propagar el error real con `{ cause: error }`
  - `src/features/auth/services/auth.service.ts`

- [ ] **4.4** `listGroupMembers` → usar el RPC `get_group_user_labels` en lugar de 2 queries
  - `src/features/groups/services/groups.service.ts`

- [ ] **4.5** Generar tipos con `supabase gen types typescript` y reemplazar mappers `row.x as string`
  - Todos los servicios

---

## Etapa 5 — Calidad, observabilidad y tooling

- [ ] **5.1** Migración para limpiar `reason` con prefijo antiguo `reward_approved:*` → `reward_redeemed:*` y agregar columnas `event_type` / `event_id` en `point_transactions`
  - Nueva migración

- [ ] **5.2** Unificar timezone en `streak.service.ts` — `Date.UTC` vs `new Date(y,m,d)` local
  - `src/features/gamification/services/streak.service.ts`

- [ ] **5.3** Eliminar `.limit(1000)` en `getMyWeeklyPointsEarned` → mover suma al servidor via RPC
  - `src/features/home/services/points.service.ts`

- [ ] **5.4** Configurar ESLint + Prettier
  - `eslint-config-expo`, regla custom para `borderWidth: 1` y uso de `Button` de RN

- [ ] **5.5** Cleanup menor
  - Eliminar `src/features/auth/types.ts` vacío
  - `trim()` en validación de formularios (CreateGroupScreen, JoinGroupScreen)
  - `ConfirmDialog`: reemplazar `Pressable onPress={() => {}}` con `View` + responder

---

## Dependencias

```
Etapa 1 → Etapa 2 → Etapa 3
                  ↘ Etapa 4 → Etapa 5
```

- **1.3** es prerequisito de **1.4** (las políticas de storage usan paths)
- Las etapas 3, 4 y 5 son independientes entre sí y se pueden parallelizar
