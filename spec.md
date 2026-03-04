# Xution

## Current State

Xution is a full-stack organization management platform on the Internet Computer. All data (members, DMs, facilities, transactions, policies, broadcasts, sessions, about text, features list) is stored on-chain in the Motoko backend canister.

**Authentication:** Custom password-based and QR ID card login (no Internet Identity). Passwords "bacon"/"leviathan" grant admin/Class 6 access. Scanning a Class 6 member's QR card also grants admin access. Sessions are stored on-chain and persisted via sessionStorage token.

**Backend (main.mo):** Stable state for members, DMs, facilities, transactions, policies, broadcasts, sessions, about text, features list, password1/password2. Authorization mixin from `authorization` component.

**Frontend:**
- `main.tsx` — app entry point
- `App.tsx` — main dashboard with accordion sections (Activity Feed, Office Selector, Members, Facilities, My Transactions, Class 6 Transactions, About, Features, Policies), bottom bar (DM, Settings, Contact Command)
- `LoginPage.tsx` — password + QR ID card login
- `MembersPage.tsx` — member management with 6-class system, XUT number, QR card upload
- `FacilitiesPage.tsx`, `PoliciesPage.tsx`, `MessagesPage.tsx`, `BroadcastsPage.tsx`, `TransactionsPage.tsx`, `DashboardPage.tsx`
- Auth hooks: `useAuth.ts`, `useAuthContext.tsx`

**Known bug (recurring):** `main.tsx` is missing `AuthContextProvider` import and wrapper, causing a blank screen. This has been fixed in this build.

## Requested Changes (Diff)

### Add
- Nothing new to add beyond the fix below.

### Modify
- `main.tsx`: Add `AuthContextProvider` import and wrap `<App />` inside `<AuthContextProvider>` so that `useAuthContext()` works throughout the tree without throwing.

### Remove
- Nothing to remove.

## Implementation Plan

1. Add `AuthContextProvider` import from `./hooks/useAuthContext` to `main.tsx`.
2. Wrap `<App />` with `<AuthContextProvider>` inside the existing `QueryClientProvider > InternetIdentityProvider` tree.
3. Verify build passes (typecheck + lint + build).
