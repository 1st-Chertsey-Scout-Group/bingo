# Step 057: Create Items PUT API Route

## Description

Create the PUT /api/items/[itemId] endpoint to allow admins to rename items. This supports the inline edit feature in the admin item management interface.

## Requirements

- Create `src/app/api/items/[itemId]/route.ts`
- Export a named `PUT` handler
- Check `x-admin-pin` header against `process.env.ADMIN_PIN`; return 401 `{ error: "Unauthorized" }` if invalid or missing
- Extract `itemId` from route params
- Parse JSON body for `name` (string)
- Validate `name` is a non-empty string after trimming; return 400 `{ error: "name is required" }` if missing or empty
- Query the item by `id`; return 404 `{ error: "Item not found" }` if it does not exist
- Update the Item record with `name: name.trim()`
- Return 200 with the updated item: `{ id: "clx...", name: "Oak tree leaf", isDefault: false, isTemplate: false }`

## Files to Create/Modify

- `src/app/api/items/[itemId]/route.ts` — create the item update endpoint

## Checklist

- [x] Implemented
- [x] Verified

## Verification

- **Check**: Returns 401 without valid X-Admin-Pin header
- **Check**: Returns 400 for missing or empty name
- **Check**: Returns 404 for non-existent itemId
- **Check**: Returns 200 with updated item on success
- **Check**: Item name is updated in the database

## Commit

`feat(api): create PUT /api/items/[itemId] admin item update endpoint`
