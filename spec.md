# Xution

## Current State

Full-stack Xution organization management platform with:
- Password login ("bacon"/"leviathan") and QR ID card login
- 6 member classes (class 5+ = senior/admin, class 6 = full admin)
- On-chain storage for members, DMs, facilities, transactions, policies, broadcasts, sessions
- Accordion-based dashboard with activity feed, office selector, members, facilities, my transactions, global transactions, about, features, policies
- Settings sheet with contact, passwords, members management, transactions, funds, broadcasts, lockdown
- Lockdown system stored as special broadcast
- Facilities page with items, sector logs, sold-out logic
- DM messaging system
- Login page with password entry and QR card upload

Core recurring bug: `AuthContextProvider` keeps going missing from `main.tsx` causing blank login page.

Password login is failing - "bacon" and "leviathan" not being accepted.

Also requested: large set of new features (see Requested Changes).

## Requested Changes (Diff)

### Add

- **Policies from the spec**: Sector policies for dorms, technology, information, recreation, offices, lab experiments/tech/projects, security, surveillance, garden/greenhouse, training area, armory, flight area, bar, restaurant, gift shop, school, supply drop area, library, med bay, containment/jail cell area -- pre-populate these category labels in the policies section
- **Policies section "Your ID"** policy preloaded
- **Policies section "Xution Information"** policy preloaded  
- **Policies section "Security and Abuse"** policy with the full detailed text provided by the user (financial abuse, verbal, physical, sexual, harassment examples)
- **Member ID card display**: Show the logged-in member's ID card image at top of dashboard after login (with fallback if none uploaded)
- **Debit card display**: Show a gold Xution debit card with the member's username and fund balance at top of dashboard
- **Fund balance tracking**: Members have a fund balance (computed from their transactions: credits minus debits). Unity and Syndelious have unlimited funds shown as ∞.
- **Unity and Syndelious**: These two special members cannot be deleted or demoted -- protect them in the UI. They always show ∞ funds.
- **Order log**: Class 5+ sees a per-facility order log showing what was bought and what needs to be made, with checkbox to mark complete
- **Supply management**: Facility items have a supplies section (what supplies are needed, how much per purchase, with images) -- item goes sold out if supplies run out
- **Buying with password or QR card**: When buying a facility item, user can authenticate with password or by uploading QR card; "bacon" links to Unity, "leviathan" links to Syndelious
- **Broadcast message at top**: Active lockdown/broadcast shows at top of page for the affected offices
- **All-buildings lockdown option**: Already exists but needs to be clearly labeled "All Buildings"
- **Sector log images/video/audio/links**: Already supported as text but UI should have explicit upload buttons for images and links in sector log
- **DM rich media**: Upload buttons for images, documents, audio, video; emoji picker; gif add/delete; voice/video call placeholders
- **DM search**: Search conversations and search within a conversation
- **Member list search**: Search bar in the accordion members list and in settings members management
- **Contact email stored on-chain**: Currently stored in React state only; should be stored in backend so it persists
- **"My Transactions" personal purchase link**: When buying from a facility, transaction auto-records under the member's personal history with facility and office label
- **Delete policy** (not deactivate): Backend already has deactivatePolicy; need a deletePolicy backend endpoint and UI change

### Modify

- **Login page bug fix**: `AuthContextProvider` must be permanently in `main.tsx`; this is the root cause of repeated "login page not showing" bugs. The fix: `main.tsx` wraps `<App/>` with `<AuthContextProvider>` AND `App.tsx` does NOT add another one, OR `App.tsx` keeps the single wrapper at app root with no double-wrapping
- **Password login reliability**: The `loginWithPassword` flow in `useAuth.ts` should add better error handling and logging; confirm `actor.verifyPassword(password)` actually returns the boolean correctly. Ensure the anonymous actor is created before login is attempted.
- **QR login uses class not role**: When scanning a QR card, check if the member's class is 6 (stored in `email` field via `encodeMemberEmail`) to grant admin access -- not the legacy `role` field
- **Member management search**: Members list in settings should be scrollable with search input
- **Facility items**: Already have items/stock/supply but need improvement -- supply depletion logic, item images, item descriptions
- **Transactions require explanation**: The description field is already required; just ensure it's clearly labeled "Explanation/Reason"
- **Remove funds**: Add a "remove funds" option alongside add funds (negative transaction)
- **Policies delete**: Replace deactivate with hard delete in both UI and backend
- **Office "copy HQ facilities"**: When creating a new office, it should NOT auto-copy facilities (this was mentioned but shouldn't silently happen -- keep as explicit action if wanted)
- **Contact email**: Store on-chain via a new backend endpoint (getContactEmail/setContactEmail) so it persists across sessions

### Remove

- **Double AuthContextProvider wrapping**: Ensure it's added only once (in `main.tsx`), remove from `App.tsx` default export wrapper if it's duplicated

## Implementation Plan

1. **Backend**: Add `deletePolicy`, `getContactEmail`, `setContactEmail` endpoints. Fix `deactivatePolicy` to be a full delete. Keep all existing stable state.

2. **main.tsx fix**: Permanently add `AuthContextProvider` to `main.tsx` wrapping `App`. Remove any double-wrapping in `App.tsx`.

3. **LoginPage**: Fix password login to handle the case where `actor.verifyPassword` may return truthy/falsy correctly. Add console logging for debugging.

4. **Dashboard top**: After login, show the member's ID card image and a gold debit card with username + fund balance. For password logins (Unity/Syndelious), show ∞.

5. **Policies**: Pre-populate standard policy categories in the UI; add "Your ID", "Xution Information", and full "Security and Abuse" policy text as defaults the admin can edit.

6. **Fund balance**: Compute per-member balance from transactions (donations/refunds add, payments/fees deduct). Show on debit card.

7. **Contact email on-chain**: New backend field + getter/setter. Frontend reads from canister on load.

8. **DM enhancements**: Search, media upload UI (images/audio/video/docs), emoji/gif pickers (UI stubs), voice/video call placeholders.

9. **Member search**: Add search inputs to members accordion and settings members list.

10. **Order log**: Class 5+ sees facility order log per facility with checkbox completion.

11. **Supply management**: Enhance facility item form with supply fields and images.

12. **Unity/Syndelious protection**: In all delete/demote UI flows, check member name and block if it's Unity or Syndelious.

13. **Policy delete**: Backend `deletePolicy` replaces deactivate in UI.
