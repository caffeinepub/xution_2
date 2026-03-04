# Xution

## Current State

Full-stack ICP app with Motoko backend and React frontend. Login via password ("bacon"/"leviathan") or QR ID card upload. Post-login dashboard has accordion sections: Activity Feed, Office Selector, Members, Facilities, About, Features, Policies. Members have two roles: `admin` and `member`. The DM system requires a "Sending as" dropdown to select your identity. Policies add/edit but have a bug preventing saving. Office Selector shows facilities read-only. Contact Command button exists but has no mailto action. About and Features sections are static read-only text.

## Requested Changes (Diff)

### Add
- 6 member classes (class1–class6) replacing the binary admin/member roles
- Class 6 QR login grants admin-level access (same as password login)
- `xutNumber` field on Member, automatically extracted from QR code data when uploading a QR card during "Add Member" flow
- Office Selector becomes a create/edit/delete manager for offices (currently called "facilities" in backend); offices are top-level named locations
- Facilities section shows items specific to the currently selected office in the Office Selector
- "Add Member" dialog collects username, class (1–6), and QR card image; auto-extracts XUT number from the QR
- About Xution accordion: Class 6 can edit the text inline
- Features & Credits accordion: Class 6 can edit the list inline
- Contact Command button sends mailto:Gameloverv@gmail.com
- Admin Settings dialog accessible to both password login AND class 6 QR login
- Backend: `addOffice`, `updateOffice`, `deleteOffice`, `getOffice`, `getAllOffices` — offices are separate from facilities
- Backend: `addFacility` now takes an `officeId` to associate a facility with an office
- Backend: `getAllFacilitiesByOffice(officeId)` query
- Backend: `updateAbout(text)` and `getAbout()` for editable about text
- Backend: `updateFeatures(features: [Text])` and `getFeatures()` for editable features list
- Backend: Member type gets `class_` field (Nat, 1–6) and `xutNumber` field (Text, optional)
- Backend: `isClass6` query — returns true if session is password-based OR if logged-in member has class 6

### Modify
- Role type: replace `#admin` / `#member` with `class_` field (1–6 Nat)
- Member creation: accepts `username`, `class_`, `xutNumber` instead of `name`/`email`/`role`
- `isCallerAdmin`: now returns true if password login OR if the caller's member record has class_ == 6
- DM system: "Sending as" select removed — if a session has a memberId, that's used automatically; otherwise pick from all members (anyone can DM anyone)
- Policies page: fix the submit logic so content actually saves to the canister (was silently failing due to empty category)
- Office Selector: replace read-only facility list with a full office CRUD manager
- Facilities accordion: show facilities filtered by the selected office from the Office Selector context

### Remove
- `email` field from Member (replaced by `username`)
- Binary role enum — replaced by numeric class system

## Implementation Plan

1. **Backend**: Update Member type to have `username`, `class_` (Nat), `xutNumber` (?Text) instead of name/email/role. Add Office type and CRUD. Add `getAllFacilitiesByOffice`. Add `getAbout`/`updateAbout`/`getFeatures`/`updateFeatures`. Update `isCallerAdmin`/`isClass6` to check class_ == 6 or password session. Update `createMember` and `updateMember` signatures.

2. **Frontend — MembersPage**: Update Add Member dialog to collect username, class (1–6 select), and optional QR card upload. On QR upload, decode QR text and pre-fill xutNumber field. Remove email field. Show class as badge.

3. **Frontend — OfficeSelector** (App.tsx): Rebuild as a full CRUD panel. Class 6 / admin sees Add/Edit/Delete buttons. Selecting an office updates a shared context/state so Facilities knows which office is selected.

4. **Frontend — FacilitiesPage**: Filter facilities by selected office from context. When adding a facility, associate it with the selected office.

5. **Frontend — PoliciesPage**: Fix submission — ensure category defaults to empty string and content is never empty; submit button was not firing correctly.

6. **Frontend — About & Features sections** (App.tsx): Wrap content in editable mode for class 6. Inline edit with save button.

7. **Frontend — Contact Command button**: Add `onClick={() => window.open("mailto:Gameloverv@gmail.com")}`.

8. **Frontend — Settings Dialog**: Allow access when `isAdmin` OR when `sessionType === "qr"` and member class is 6. Since `isCallerAdmin` already handles this server-side, just ensure the UI gate uses `isAdmin` query result.

9. **Frontend — MessagesPage**: Remove "Sending as" select. Use `currentMemberId` from auth context when available; fall back to member picker only if no session memberId.
