# Xution

## Current State

Full-stack ICP app. Backend (Motoko): members, DMs, facilities, transactions, policies, broadcasts, sessions, passwords, about/features text — all on-chain. Frontend: React + Tailwind accordion dashboard. Login via password ("bacon"/"leviathan") or QR ID card upload. Class system (1–6) encoded in `email` field. Offices use a Facility with `location="__OFFICE__"`. Facilities for an office have `location="office:<id>"`. Admin = Class 5+. No lockdown, no sector logs, no items/stock/supply tracking on facilities, policies only deactivate (not delete), Members page is exposed in accordion, member add/edit/delete is in members accordion instead of settings.

## Requested Changes (Diff)

### Add

**Backend:**
- `contactEmail` settable canister variable (default `Gameloverv@gmail.com`)
- `getContactEmail()` / `setContactEmail(email)` — class 6 only
- `lockdownState`: `{ active: Bool; message: Text; officeIds: [Text] }` — class 6 only to set
- `getLockdownState()` / `setLockdown(active, message, officeIds)` — class 6 to set, all to get
- `deletePolicy(id)` — replaces `deactivatePolicy`
- `FacilityItem` type: `{ id; facilityId; name; description; imageDataUrl: ?Text; price: Int; stock: Int; supply: Int; soldOut: Bool }`
- `addFacilityItem`, `updateFacilityItem`, `removeFacilityItem`, `getFacilityItems(facilityId)` — class 6 only to add/edit/remove; all can read
- `SectorLog` type: `{ id; facilityId; content; mediaDataUrl: ?Text; mediaType: ?Text; authorId; classLevel: Int; createdAt: Int }`
- `addSectorLog`, `getSectorLogs(facilityId)` — class 5+ to add, class-filtered read
- Office: add `address` field to facility (stored in `location` field alongside `__OFFICE__` prefix: `__OFFICE__|addr:<address>`)
- Personal transaction add: members can add payment-type only transactions to themselves
- `addFunds(memberId, amount, description)` — class 6 only admin action to credit/debit member
- Transaction record: add `officeId: ?Text` field to track location (stored in description prefix: `[office:<id>]` or `[other]`)

**Frontend:**
- Settings sheet: now includes contact email editor, password management, member add/edit/remove/promote/demote, global transactions (class 6 only, shows location-specific when an office is selected), add/remove funds from member
- Lockdown toggle in settings: toggleable, editable broadcast message, multi-office or all-offices selector; when active, non-class-6 see redacted info and cannot buy items; banner shown to all
- Facilities: each facility is collapsible; holds items section (scrollable) with image, description, price, stock, supply — sold out if stock=0 or supply=0; buy button for members (creates payment transaction); sector log section (scrollable, class 5+ can post, class-filtered visibility); items and sector logs each have image upload
- Members accordion: removes Add/Edit/Delete buttons (those move to settings); class 5+ see XUT number column; class 4 and below don't see XUT column
- Office selector: each office shows editable address/location field; edit button for admin
- Policies: delete button instead of deactivate
- Contact Command button: opens `mailto:<contactEmail>`
- "My Transactions" section: add personal payment transaction button
- Transaction display: shows office/facility label, or "Other" if not location-specific

### Modify

- `Facility` type: `location` field now encodes office address for offices (`__OFFICE__|addr:<address>`); facilities for office stay `office:<id>`
- `Member`: no schema change; class/xut still encoded in `email` field
- `Policy`: add `deletePolicy` endpoint, remove deactivatePolicy from frontend
- `Transaction`: `facilityId` and new `officeId` concept stored in description prefix
- Settings panel: expanded to include member management, global transactions, add funds
- Members accordion: read-only for class 4 and below (no XUT shown), class 5+ see XUT

### Remove

- `deactivatePolicy` from frontend UI (policy now has delete)
- Add/Edit/Delete member controls from Members accordion (moved to Settings)
- Members accordion no longer shows Add Member button inline

## Implementation Plan

**Backend changes:**
1. Add `contactEmail` stable var + getter/setter
2. Add `LockdownState` type + stable var + getter/setter (class 6 auth)
3. Add `deletePolicy` (removes from map entirely) alongside existing `deactivatePolicy`
4. Add `FacilityItem` type + stable map `facilityItems` + CRUD endpoints
5. Add `SectorLog` type + stable map `sectorLogs` + add/get endpoints
6. Modify `addFunds` — a special transaction of type `fee`/`donation` that only class 6 can add for any member
7. Transaction `description` prefixes: `[facility:<id>]`, `[office:<id>]`, or `[other]` prepended by frontend
8. Office location encoding: `__OFFICE__|addr:<address>` for offices with address
9. Lockdown: `setLockdown` stores active flag + message + affected officeIds

**Frontend changes:**
1. Fix `main.tsx` to always wrap with `AuthContextProvider`
2. Settings sheet: add member CRUD forms, contact email, add funds dialog
3. Global transactions in settings (class 6): show all transactions, filter by selected office
4. Personal transactions: add "Add Payment" button for logged-in member
5. Transaction rows: parse and display location prefix as office name, facility name, or "Other"
6. Lockdown: class 6 toggle in settings; when active show banner; redact info for non-class-6; disable buy buttons
7. Facilities: convert cards to collapsible with items section + sector log section
8. Facility items: name, desc, image, price, stock, supply; sold-out logic; buy button
9. Sector logs: class 5+ can post text + optional image/video/audio/link; content filtered by classLevel
10. Members accordion: class 5+ see XUT; class 4 and below do not; no add/edit/delete inline
11. Office selector: address field; admin edit office to set address
12. Policies: replace deactivate with delete
13. Contact Command button: uses `contactEmail` from canister
14. Broadcast: lockdown-specific controls (message, office selector, toggle)
