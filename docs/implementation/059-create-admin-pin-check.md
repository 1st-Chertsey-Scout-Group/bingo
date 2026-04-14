# Step 059: Create Admin PIN Check Helper

## Description

Extract the admin PIN validation logic into a reusable helper function. This eliminates duplication across all admin-protected API routes and centralizes the authorization check.

## Requirements

- Create `src/lib/admin.ts`
- Export a named function `checkAdminPin(headers: Headers): boolean`
  - Reads the `x-admin-pin` header from the provided Headers object (case-insensitive, handled by the Headers API)
  - Compares it against `process.env.ADMIN_PIN`
  - Returns `true` if they match, `false` otherwise
  - Returns `false` if `ADMIN_PIN` env var is not set
  - Returns `false` if the header is missing or empty
- Export a named helper function `unauthorizedResponse(): NextResponse`
  - Returns `NextResponse.json({ error: "Unauthorized" }, { status: 401 })`
  - Used by admin routes for consistent 401 responses
- Refactor existing admin API routes (steps 052, 055, 056, 057, 058) to use `checkAdminPin` and `unauthorizedResponse` instead of inline checks

## Files to Create/Modify

- `src/lib/admin.ts` — create the admin PIN check utility
- `src/app/api/game/route.ts` — refactor to use `checkAdminPin`
- `src/app/api/items/route.ts` — refactor to use `checkAdminPin`
- `src/app/api/items/[itemId]/route.ts` — refactor to use `checkAdminPin`

## Checklist

- [ ] Implemented
- [ ] Verified

## Verification

- **Check**: `checkAdminPin` returns true for correct PIN
- **Check**: `checkAdminPin` returns false for incorrect PIN
- **Check**: `checkAdminPin` returns false for missing header
- **Check**: All admin routes still return 401 for invalid PIN after refactor
- **Command**: `grep -r "checkAdminPin" src/app/api/`

## Commit

`refactor(auth): extract admin PIN check into reusable helper`
