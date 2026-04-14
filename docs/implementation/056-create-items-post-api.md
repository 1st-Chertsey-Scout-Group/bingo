# Step 056: Add Items POST API Handler

## Description

Add a POST handler to the items route to allow admins to create new items. New items are created as non-default, non-template items that can be added to game boards.

## Requirements

- Add a named `POST` export to `src/app/api/items/route.ts`
- Check `x-admin-pin` header against `process.env.ADMIN_PIN`; return 401 `{ error: "Unauthorized" }` if invalid or missing
- Parse JSON body for `name` (string)
- Validate `name` is a non-empty string after trimming; return 400 `{ error: "name is required" }` if missing or empty
- Create an Item record with `name: name.trim()`, `isDefault: false`, `isTemplate: false`
- Return 201 with the created item: `{ id: "clx...", name: "Oak leaf", isDefault: false, isTemplate: false }`

## Files to Create/Modify

- `src/app/api/items/route.ts` — add POST handler to existing items route file

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Returns 401 without valid X-Admin-Pin header
- **Check**: Returns 400 for missing or empty name
- **Check**: Returns 400 for whitespace-only name
- **Check**: Returns 201 with created item on success
- **Check**: Created item has `isDefault: false` and `isTemplate: false`

## Commit

`feat(api): add POST /api/items admin item creation endpoint`
